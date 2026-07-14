import "server-only";

import { BlobError, BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { z } from "zod";

import {
  adminAuditSchema,
  merchItemSchema,
  showSchema,
  type AdminAuditEntry,
  type MerchItem,
  type Show,
} from "@/content/schema";
import { getDataNamespace, requireWritableDeployment } from "@/lib/runtime-environment";

const MAX_MUTATION_ATTEMPTS = 4;
const MAX_AUDIT_ENTRIES = 100;

const CONTENT_FILES = {
  shows: "shows.json",
  merch: "merch.json",
  audit: "admin-audit.json",
} as const;

type ContentKey = keyof typeof CONTENT_FILES;
type MutationResult<T, R> = { data: T; result: R };

export class ContentConflictError extends Error {
  constructor() {
    super("Content changed while this update was being saved. Please try again.");
    this.name = "ContentConflictError";
  }
}

function getContentToken() {
  const token = process.env.CONTENT_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error("CONTENT_BLOB_READ_WRITE_TOKEN is not configured.");
  }
  return token;
}

function getContentPath(key: ContentKey) {
  return `content/${getDataNamespace()}/${CONTENT_FILES[key]}`;
}

async function readSnapshot<T>(key: ContentKey, schema: z.ZodType<T>, fallback: T) {
  const response = await get(getContentPath(key), {
    access: "private",
    token: getContentToken(),
    useCache: false,
  });

  if (!response) {
    return { data: schema.parse(fallback), etag: null };
  }

  const raw = await new Response(response.stream).text();
  return {
    data: schema.parse(JSON.parse(raw)),
    etag: response.blob.etag,
  };
}

async function mutateJson<T, R>(
  key: ContentKey,
  schema: z.ZodType<T>,
  fallback: T,
  mutate: (current: T) => MutationResult<T, R> | Promise<MutationResult<T, R>>,
) {
  requireWritableDeployment();
  for (let attempt = 0; attempt < MAX_MUTATION_ATTEMPTS; attempt += 1) {
    const current = await readSnapshot(key, schema, fallback);
    const mutation = await mutate(current.data);
    const validated = schema.parse(mutation.data);

    try {
      await put(getContentPath(key), `${JSON.stringify(validated, null, 2)}\n`, {
        access: "private",
        token: getContentToken(),
        contentType: "application/json",
        cacheControlMaxAge: 60,
        allowOverwrite: current.etag !== null,
        ...(current.etag ? { ifMatch: current.etag } : {}),
      });
      return mutation.result;
    } catch (error) {
      const isConflict =
        error instanceof BlobPreconditionFailedError ||
        (current.etag === null && error instanceof BlobError);
      if (!isConflict) {
        throw error;
      }
    }
  }

  throw new ContentConflictError();
}

export async function readShows() {
  return (await readSnapshot("shows", showSchema.array(), [])).data;
}

export async function mutateShows<R>(
  mutate: (shows: Show[]) => MutationResult<Show[], R> | Promise<MutationResult<Show[], R>>,
) {
  return mutateJson("shows", showSchema.array(), [], mutate);
}

export async function readMerch() {
  return (await readSnapshot("merch", merchItemSchema.array(), [])).data;
}

export async function mutateMerch<R>(
  mutate: (
    items: MerchItem[],
  ) => MutationResult<MerchItem[], R> | Promise<MutationResult<MerchItem[], R>>,
) {
  return mutateJson("merch", merchItemSchema.array(), [], mutate);
}

export async function readAudit() {
  return (await readSnapshot("audit", adminAuditSchema.array(), [])).data;
}

export async function appendAuditEntry(entry: AdminAuditEntry) {
  return mutateJson("audit", adminAuditSchema.array(), [], (entries) => ({
    data: [entry, ...entries].slice(0, MAX_AUDIT_ENTRIES),
    result: undefined,
  }));
}
