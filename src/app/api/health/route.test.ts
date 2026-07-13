import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SiteOperationsSummary } from "@/lib/site-operations";

const getSiteOperationsSummaryMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/site-operations", () => ({
  getSiteOperationsSummary: getSiteOperationsSummaryMock,
}));

import { GET } from "./route";

function createSummary({
  isProduction,
  mediaWritable,
}: {
  isProduction: boolean;
  mediaWritable: boolean;
}) {
  return {
    timestamp: "2026-07-13T00:00:00.000Z",
    environment: {
      nodeEnv: isProduction ? "production" : "development",
      isProduction,
      appPort: "3000",
    },
    storage: {
      mode: "external",
      usingPersistentRateLimit: true,
    },
    paths: {
      mediaRoot: { writable: mediaWritable },
      mediaHistoryRoot: { writable: mediaWritable },
    },
    content: {
      allValid: true,
      shows: { valid: true, count: 1 },
      merch: { valid: true, count: 1 },
      audit: { valid: true, count: 0 },
    },
    warnings: [],
  } as unknown as SiteOperationsSummary;
}

describe("health route", () => {
  beforeEach(() => {
    getSiteOperationsSummaryMock.mockReset();
  });

  it("returns 503 when production media storage is unavailable", async () => {
    getSiteOperationsSummaryMock.mockResolvedValue(
      createSummary({ isProduction: true, mediaWritable: false }),
    );

    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "error",
      storage: { mediaWritable: false },
    });
  });

  it("does not require persistent media storage in development", async () => {
    getSiteOperationsSummaryMock.mockResolvedValue(
      createSummary({ isProduction: false, mediaWritable: false }),
    );

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
  });
});
