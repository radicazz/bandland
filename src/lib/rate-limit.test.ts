import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const tempDirs: string[] = [];

async function createTempRateLimitDir() {
  const directory = await mkdtemp(path.join(tmpdir(), "bandland-rate-limit-test-"));
  tempDirs.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("createRateLimiter", () => {
  it("allows up to the limit within the window", async () => {
    const limiter = createRateLimiter({
      limit: 2,
      windowMs: 1000,
      storageDir: await createTempRateLimitDir(),
    });
    const first = await limiter.check("ip", 0);
    const second = await limiter.check("ip", 1);
    const third = await limiter.check("ip", 2);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("resets after the window expires", async () => {
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      storageDir: await createTempRateLimitDir(),
    });
    const first = await limiter.check("ip", 0);
    const second = await limiter.check("ip", 1001);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
  });

  it("persists attempts across limiter instances that share a storage directory", async () => {
    const storageDir = await createTempRateLimitDir();
    const firstLimiter = createRateLimiter({ limit: 2, windowMs: 1000, storageDir });
    const secondLimiter = createRateLimiter({ limit: 2, windowMs: 1000, storageDir });

    await firstLimiter.check("ip", 0);
    const second = await secondLimiter.check("ip", 1);
    const third = await secondLimiter.check("ip", 2);

    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });
});

describe("getClientIp", () => {
  it("prefers x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "9.8.7.6" });
    expect(getClientIp(headers)).toBe("9.8.7.6");
  });

  it("returns unknown when no headers exist", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });
});
