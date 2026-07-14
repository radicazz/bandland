import { beforeEach, describe, expect, it, vi } from "vitest";

const blobMocks = vi.hoisted(() => {
  class BlobError extends Error {}
  class BlobPreconditionFailedError extends BlobError {}
  return {
    BlobError,
    BlobPreconditionFailedError,
    get: vi.fn(),
    put: vi.fn(),
  };
});

vi.mock("@vercel/blob", () => blobMocks);

import { appendAuditEntry, mutateShows, readAudit, readShows } from "@/lib/content-store";

function blobResponse(value: unknown, etag = "etag-1") {
  return {
    stream: new Response(JSON.stringify(value)).body,
    blob: { etag },
  };
}

describe("Vercel content store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CONTENT_BLOB_READ_WRITE_TOKEN = "content-token";
    delete process.env.VERCEL_ENV;
    blobMocks.get.mockResolvedValue(null);
    blobMocks.put.mockResolvedValue({});
  });

  it("returns empty content when a namespace has not been initialized", async () => {
    await expect(readShows()).resolves.toEqual([]);
    expect(blobMocks.get).toHaveBeenCalledWith("content/development/shows.json", {
      access: "private",
      token: "content-token",
      useCache: false,
    });
  });

  it("blocks writes from Preview at the storage boundary", async () => {
    process.env.VERCEL_ENV = "preview";
    await expect(mutateShows((shows) => ({ data: shows, result: undefined }))).rejects.toThrow(
      "Preview deployments are read-only",
    );
    expect(blobMocks.put).not.toHaveBeenCalled();
  });

  it("retries a conditional-write conflict using the latest data", async () => {
    blobMocks.get
      .mockResolvedValueOnce(blobResponse([], "etag-1"))
      .mockResolvedValueOnce(blobResponse([], "etag-2"));
    blobMocks.put
      .mockRejectedValueOnce(new blobMocks.BlobPreconditionFailedError())
      .mockResolvedValueOnce({});

    await mutateShows((shows) => ({ data: shows, result: undefined }));
    expect(blobMocks.put).toHaveBeenCalledTimes(2);
    expect(blobMocks.put).toHaveBeenLastCalledWith(
      "content/development/shows.json",
      "[]\n",
      expect.objectContaining({ ifMatch: "etag-2", allowOverwrite: true }),
    );
  });

  it("caps the audit log at 100 records", async () => {
    const entries = Array.from({ length: 100 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      actor: "admin",
      action: "create" as const,
      entity: "shows" as const,
      entityId: "70164137-f515-40b9-be69-d059f433bf21",
      createdAt: "2026-01-01T00:00:00Z",
    }));
    blobMocks.get.mockResolvedValueOnce(blobResponse(entries));

    await appendAuditEntry({
      id: "70164137-f515-40b9-be69-d059f433bf21",
      actor: "admin",
      action: "update",
      entity: "shows",
      entityId: "70164137-f515-40b9-be69-d059f433bf21",
      createdAt: "2026-02-01T00:00:00Z",
    });

    const written = JSON.parse(blobMocks.put.mock.calls[0]?.[1] as string) as unknown[];
    expect(written).toHaveLength(100);
    blobMocks.get.mockResolvedValueOnce(blobResponse(written));
    await expect(readAudit()).resolves.toHaveLength(100);
  });
});
