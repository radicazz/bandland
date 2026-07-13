import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const roots: string[] = [];
const imageId = "70164137-f515-40b9-be69-d059f433bf21";

afterEach(async () => {
  delete process.env.MEDIA_DIR;
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
  vi.resetModules();
});

describe("managed media route", () => {
  it("serves a supported immutable variant", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "bandland-media-route-"));
    roots.push(root);
    process.env.MEDIA_DIR = root;
    await fs.writeFile(path.join(root, `${imageId}-640.webp`), Buffer.from("webp"));
    vi.resetModules();
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ imageId, size: "640.webp" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toContain("immutable");
  });

  it("returns 404 for invalid identifiers and unsupported sizes", async () => {
    const { GET } = await import("./route");

    const invalidId = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ imageId: "not-an-id", size: "640.webp" }),
    });
    const invalidSize = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ imageId, size: "320.webp" }),
    });

    expect(invalidId.status).toBe(404);
    expect(invalidSize.status).toBe(404);
  });
});
