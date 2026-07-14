import type { HandleUploadOptions } from "@vercel/blob/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  handleUpload: vi.fn(),
}));
const developmentPath = "media/development/shows/70164137-f515-40b9-be69-d059f433bf21-poster.webp";
const productionPath = "media/production/shows/70164137-f515-40b9-be69-d059f433bf21-poster.webp";

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@vercel/blob/client", () => ({ handleUpload: mocks.handleUpload }));

import { POST } from "./route";

function uploadRequest() {
  return new Request("https://bandland.test/api/blob/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: {
        pathname: developmentPath,
        multipart: false,
        clientPayload: null,
      },
    }),
  });
}

describe("Blob upload token route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.VERCEL_ENV;
    process.env.MEDIA_BLOB_READ_WRITE_TOKEN = "media-token";
    mocks.auth.mockResolvedValue({ user: { name: "Admin" } });
    mocks.handleUpload.mockImplementation(async (options: HandleUploadOptions) => {
      await options.onBeforeGenerateToken(developmentPath, null, false);
      return { type: "blob.generate-client-token", clientToken: "client-token" };
    });
  });

  it("issues an upload token for an authenticated local admin", async () => {
    const response = await POST(uploadRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ clientToken: "client-token" });
  });

  it("rejects unauthenticated token requests", async () => {
    mocks.auth.mockResolvedValueOnce(null);
    const response = await POST(uploadRequest());
    expect(response.status).toBe(401);
  });

  it("rejects upload tokens in Preview", async () => {
    process.env.VERCEL_ENV = "preview";
    mocks.handleUpload.mockImplementationOnce(async (options: HandleUploadOptions) => {
      await options.onBeforeGenerateToken(productionPath, null, false);
      return { type: "blob.generate-client-token", clientToken: "never" };
    });
    const response = await POST(uploadRequest());
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Preview deployments are read-only",
    });
  });
});
