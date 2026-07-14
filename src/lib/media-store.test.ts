import { beforeEach, describe, expect, it, vi } from "vitest";

const blobMocks = vi.hoisted(() => ({
  del: vi.fn(),
  head: vi.fn(),
}));

vi.mock("@vercel/blob", () => blobMocks);

import {
  discardManagedMedia,
  getMediaUploadPrefix,
  MediaValidationError,
  validateManagedMedia,
} from "@/lib/media-store";

const url = "https://store.public.blob.vercel-storage.com/media/development/shows/poster.webp";

describe("Vercel media store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MEDIA_BLOB_READ_WRITE_TOKEN = "media-token";
    delete process.env.VERCEL_ENV;
    blobMocks.head.mockResolvedValue({
      url,
      pathname: "media/development/shows/poster.webp",
      contentType: "image/webp",
      size: 1024,
    });
  });

  it("uses isolated development and production upload prefixes", () => {
    expect(getMediaUploadPrefix("shows")).toBe("media/development/shows/");
    process.env.VERCEL_ENV = "preview";
    expect(getMediaUploadPrefix("merch")).toBe("media/production/merch/");
  });

  it("accepts a verified managed image", async () => {
    await expect(validateManagedMedia(url, "shows")).resolves.toBe(url);
    expect(blobMocks.head).toHaveBeenCalledWith(url, { token: "media-token" });
  });

  it("rejects images outside the expected namespace", async () => {
    blobMocks.head.mockResolvedValueOnce({
      url,
      pathname: "media/production/shows/poster.webp",
      contentType: "image/webp",
      size: 1024,
    });
    await expect(validateManagedMedia(url, "shows")).rejects.toBeInstanceOf(MediaValidationError);
  });

  it("deletes verified managed media", async () => {
    await discardManagedMedia(url);
    expect(blobMocks.del).toHaveBeenCalledWith(url, { token: "media-token" });
  });
});
