import "server-only";

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

import {
  adminAuditSchema,
  merchItemSchema,
  showSchema,
  type AdminAuditEntry,
  type MerchItem,
  type Show,
} from "@/content/schema";

const CONTENT_ROOT =
  process.env.CONTENT_DIR?.trim() || path.join(process.cwd(), "content");
const HISTORY_ROOT =
  process.env.CONTENT_HISTORY_DIR?.trim() || path.join(CONTENT_ROOT, ".history");
const MAX_BACKUPS = 50;

const CONTENT_FILES = {
  shows: "shows.json",
  merch: "merch.json",
  audit: "admin-audit.json",
} as const;

type ContentKey = keyof typeof CONTENT_FILES;

function resolveContentPath(key: ContentKey) {
  return path.join(CONTENT_ROOT, CONTENT_FILES[key]);
}

async function ensureHistoryDir() {
  await fs.mkdir(HISTORY_ROOT, { recursive: true });
}

async function ensureContentDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function buildBackupName(filePath: string) {
  const base = path.basename(filePath, ".json");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${base}-${timestamp}.json`;
}

async function createBackup(filePath: string) {
  try {
    await ensureHistoryDir();
    const backupPath = path.join(HISTORY_ROOT, buildBackupName(filePath));
    await fs.copyFile(filePath, backupPath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

async function pruneBackups(filePath: string) {
  try {
    const base = path.basename(filePath, ".json");
    const entries = await fs.readdir(HISTORY_ROOT);
    const matches = entries
      .filter((entry) => entry.startsWith(`${base}-`))
      .sort();
    if (matches.length <= MAX_BACKUPS) {
      return;
    }
    const toRemove = matches.slice(0, matches.length - MAX_BACKUPS);
    await Promise.all(
      toRemove.map((entry) => fs.unlink(path.join(HISTORY_ROOT, entry))),
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

async function readJsonFile<T>(
  key: ContentKey,
  schema: z.ZodType<T>,
  fallback?: T,
) {
  const filePath = resolveContentPath(key);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return schema.parse(parsed);
  } catch (error) {
    if (
      fallback !== undefined &&
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return schema.parse(fallback);
    }
    throw error;
  }
}

async function writeJsonFile<T>(key: ContentKey, schema: z.ZodType<T>, data: T) {
  const filePath = resolveContentPath(key);
  const validated = schema.parse(data);
  await createBackup(filePath);
  await ensureContentDir(filePath);
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  const serialized = `${JSON.stringify(validated, null, 2)}\n`;
  await fs.writeFile(tempPath, serialized, "utf8");
  await fs.rename(tempPath, filePath);
  await pruneBackups(filePath);
  return validated;
}

export async function readShows() {
  return readJsonFile("shows", showSchema.array(), []);
}

export async function writeShows(shows: Show[]) {
  return writeJsonFile("shows", showSchema.array(), shows);
}

export async function readMerch() {
  return readJsonFile("merch", merchItemSchema.array(), []);
}

export async function writeMerch(items: MerchItem[]) {
  return writeJsonFile("merch", merchItemSchema.array(), items);
}

export async function readAudit() {
  return readJsonFile("audit", adminAuditSchema.array(), []);
}

export async function writeAudit(entries: AdminAuditEntry[]) {
  return writeJsonFile("audit", adminAuditSchema.array(), entries);
}

export async function appendAuditEntry(entry: AdminAuditEntry) {
  const existing = await readAudit();
  return writeAudit([entry, ...existing]);
}
