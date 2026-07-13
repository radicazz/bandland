#!/usr/bin/env node
import { execFile } from "node:child_process";
import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    repoDir: process.cwd(),
    serviceName: "bandland",
    envFile: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (!arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }

    switch (arg) {
      case "--repo-dir":
        args.repoDir = next;
        break;
      case "--service-name":
        args.serviceName = next;
        break;
      case "--env-file":
        args.envFile = next;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }

    index += 1;
  }

  return args;
}

function normalizeEnvValue(value) {
  let normalized = value.trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }
  return normalized.replaceAll("\\$", "$");
}

async function loadEnvFile(envFilePath) {
  const contents = await fs.readFile(envFilePath, "utf8");
  const values = {};

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1);
    values[key] = normalizeEnvValue(value);
  }

  return values;
}

async function canAccess(targetPath, mode) {
  return fs
    .access(targetPath, mode)
    .then(() => true)
    .catch(() => false);
}

async function inspectDirectory(targetPath) {
  try {
    const stats = await fs.stat(targetPath);
    if (!stats.isDirectory()) {
      return { exists: true, readable: false, writable: false, isDirectory: false };
    }

    const [readable, writable] = await Promise.all([
      canAccess(targetPath, fsConstants.R_OK),
      canAccess(targetPath, fsConstants.W_OK),
    ]);

    return { exists: true, readable, writable, isDirectory: true };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { exists: false, readable: false, writable: false, isDirectory: false };
    }
    throw error;
  }
}

async function validateJsonArrayFile(filePath, label, requiredFields) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return `${label} must be a JSON array.`;
    }

    for (const [index, item] of parsed.entries()) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return `${label} item ${index + 1} must be an object.`;
      }

      for (const field of requiredFields) {
        if (typeof item[field] !== "string" || item[field].trim().length === 0) {
          return `${label} item ${index + 1} is missing ${field}.`;
        }
      }
    }

    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Unknown error";
  }
}

function pushError(target, message) {
  target.errors.push(message);
}

function pushWarning(target, message) {
  target.warnings.push(message);
}

const args = parseArgs(process.argv.slice(2));
const repoDir = path.resolve(args.repoDir);
const envFilePath = args.envFile ? path.resolve(args.envFile) : null;

const results = {
  errors: [],
  warnings: [],
};

try {
  const packageJsonPath = path.join(repoDir, "package.json");
  await fs.access(packageJsonPath, fsConstants.R_OK);

  if (!envFilePath) {
    pushError(results, "No env file was provided to preflight.");
  } else {
    await fs.access(envFilePath, fsConstants.R_OK);
  }

  if (typeof process.getuid === "function" && process.getuid() !== 0) {
    pushWarning(
      results,
      "Preflight is running without root privileges. Filesystem writability checks reflect the current user.",
    );
  }

  const env = envFilePath ? await loadEnvFile(envFilePath) : {};
  const requiredEnvKeys = [
    "ADMIN_PASSWORD_HASH",
    "AUTH_SECRET",
    "AUTH_URL",
    "NEXT_PUBLIC_SITE_URL",
    "MEDIA_DIR",
  ];

  for (const key of requiredEnvKeys) {
    if (!env[key]) {
      pushError(results, `${key} is missing from ${envFilePath ?? "the env file"}.`);
    }
  }

  const contentDir = env.CONTENT_DIR || path.join(repoDir, "content");
  const historyDir = env.CONTENT_HISTORY_DIR || path.join(contentDir, ".history");
  const rateLimitDir = env.AUTH_RATE_LIMIT_DIR || null;
  const mediaDir = env.MEDIA_DIR || path.join(repoDir, "content", "media");
  const mediaHistoryDir = env.MEDIA_HISTORY_DIR || path.join(mediaDir, ".history");

  const [
    contentDirStatus,
    historyDirStatus,
    rateLimitDirStatus,
    mediaDirStatus,
    mediaHistoryDirStatus,
  ] = await Promise.all([
    inspectDirectory(contentDir),
    inspectDirectory(historyDir),
    rateLimitDir ? inspectDirectory(rateLimitDir) : Promise.resolve(null),
    inspectDirectory(mediaDir),
    inspectDirectory(mediaHistoryDir),
  ]);

  for (const [label, directory, status] of [
    ["Media directory", mediaDir, mediaDirStatus],
    ["Media history directory", mediaHistoryDir, mediaHistoryDirStatus],
  ]) {
    if (!status.exists || !status.isDirectory || !status.readable || !status.writable) {
      pushError(results, `${label} is missing or not readable and writable: ${directory}`);
    }
  }

  if (!contentDirStatus.exists || !contentDirStatus.isDirectory) {
    pushError(results, `Content directory is missing or invalid: ${contentDir}`);
  } else if (!contentDirStatus.readable || !contentDirStatus.writable) {
    pushError(results, `Content directory is not readable and writable: ${contentDir}`);
  }

  if (env.CONTENT_HISTORY_DIR) {
    if (!historyDirStatus.exists || !historyDirStatus.isDirectory) {
      pushError(results, `Configured history directory is missing or invalid: ${historyDir}`);
    } else if (!historyDirStatus.readable || !historyDirStatus.writable) {
      pushError(
        results,
        `Configured history directory is not readable and writable: ${historyDir}`,
      );
    }
  } else if (!contentDirStatus.writable) {
    pushError(
      results,
      "Content directory is not writable, so automatic backup creation will fail.",
    );
  }

  if (rateLimitDir) {
    if (!rateLimitDirStatus?.exists || !rateLimitDirStatus.isDirectory) {
      pushError(results, `Configured rate-limit directory is missing or invalid: ${rateLimitDir}`);
    } else if (!rateLimitDirStatus.readable || !rateLimitDirStatus.writable) {
      pushError(
        results,
        `Configured rate-limit directory is not readable and writable: ${rateLimitDir}`,
      );
    }
  } else {
    pushWarning(
      results,
      "AUTH_RATE_LIMIT_DIR is not configured. Admin rate limiting will reset after every restart.",
    );
  }

  const fileChecks = await Promise.all([
    validateJsonArrayFile(path.join(contentDir, "shows.json"), "shows.json", [
      "id",
      "date",
      "venue",
      "city",
      "createdAt",
      "updatedAt",
    ]),
    validateJsonArrayFile(path.join(contentDir, "merch.json"), "merch.json", [
      "id",
      "name",
      "price",
      "href",
      "createdAt",
      "updatedAt",
    ]),
    validateJsonArrayFile(path.join(contentDir, "admin-audit.json"), "admin-audit.json", [
      "id",
      "actor",
      "action",
      "entity",
      "entityId",
      "createdAt",
    ]),
  ]);

  for (const issue of fileChecks) {
    if (issue) {
      pushError(results, issue);
    }
  }

  try {
    const output = await new Promise((resolve, reject) => {
      execFile(
        "systemctl",
        ["list-unit-files", `${args.serviceName}.service`, "--no-legend"],
        (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(stdout);
        },
      );
    });

    if (!String(output).includes(`${args.serviceName}.service`)) {
      pushError(results, `systemd unit not found: ${args.serviceName}.service`);
    }
  } catch (error) {
    pushError(
      results,
      error instanceof Error
        ? `Unable to verify systemd unit ${args.serviceName}.service: ${error.message}`
        : "Unable to verify systemd unit.",
    );
  }

  if (!env.CONTENT_DIR) {
    pushWarning(
      results,
      "CONTENT_DIR is not configured. Production content will be read from the repo checkout.",
    );
  }

  console.log(`Preflight repo: ${repoDir}`);
  if (envFilePath) {
    console.log(`Preflight env: ${envFilePath}`);
  }
  console.log(`Content directory: ${contentDir}`);
  console.log(`History directory: ${historyDir}`);
  console.log(`Rate-limit directory: ${rateLimitDir ?? "not configured"}`);
  console.log(`Media directory: ${mediaDir}`);

  for (const warning of results.warnings) {
    console.warn(`Warning: ${warning}`);
  }

  if (results.errors.length > 0) {
    for (const error of results.errors) {
      console.error(`Error: ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Preflight passed.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unknown preflight error");
  process.exitCode = 1;
}
