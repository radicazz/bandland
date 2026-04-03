import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  storageDir?: string | undefined;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

function resolveRateLimitDir(storageDir?: string) {
  return storageDir?.trim() || path.join(tmpdir(), "bandland-auth-rate-limit");
}

function getRateLimitFilePath(storageDir: string, key: string) {
  const hash = createHash("sha256").update(key).digest("hex");
  return path.join(storageDir, `${hash}.json`);
}

async function readRateLimitEntry(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<RateLimitEntry>;
    if (
      typeof parsed.count === "number" &&
      Number.isFinite(parsed.count) &&
      typeof parsed.resetAt === "number" &&
      Number.isFinite(parsed.resetAt)
    ) {
      return {
        count: parsed.count,
        resetAt: parsed.resetAt,
      } satisfies RateLimitEntry;
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  return null;
}

async function writeRateLimitEntry(filePath: string, entry: RateLimitEntry) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(entry)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
}

export function createRateLimiter({ limit, windowMs, storageDir }: RateLimitOptions) {
  const rateLimitDir = resolveRateLimitDir(storageDir);
  return {
    async check(key: string, now: number = Date.now()): Promise<RateLimitResult> {
      const filePath = getRateLimitFilePath(rateLimitDir, key);
      const existing = await readRateLimitEntry(filePath);

      if (!existing || now > existing.resetAt) {
        const next: RateLimitEntry = { count: 1, resetAt: now + windowMs };
        await writeRateLimitEntry(filePath, next);
        return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: next.resetAt };
      }

      const nextCount = existing.count + 1;
      const next: RateLimitEntry = { count: nextCount, resetAt: existing.resetAt };
      await writeRateLimitEntry(filePath, next);
      return {
        allowed: nextCount <= limit,
        remaining: Math.max(0, limit - nextCount),
        resetAt: next.resetAt,
      };
    },
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}
