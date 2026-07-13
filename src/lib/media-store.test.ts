import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";

const createdDirectories: string[] = [];

afterEach(async () => {
  delete process.env.MEDIA_DIR;
  delete process.env.MEDIA_HISTORY_DIR;
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("media store", () => {
  it("creates normalized responsive variants", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "bandland-media-"));
    createdDirectories.push(root);
    process.env.MEDIA_DIR = root;
    process.env.MEDIA_HISTORY_DIR = path.join(root, ".history");
    vi.resetModules();
    const { getMediaPath, processMediaUpload } = await import("./media-store");
    const source = await sharp({
      create: { width: 900, height: 500, channels: 3, background: "#111111" },
    })
      .jpeg()
      .toBuffer();
    const file = new File([source], "poster.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () =>
        source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
    });

    const imageId = await processMediaUpload(file);

    expect(imageId).toMatch(/^[0-9a-f-]{36}$/);
    const small = await sharp(getMediaPath(imageId as string, 640)).metadata();
    const large = await sharp(getMediaPath(imageId as string, 1280)).metadata();
    expect([small.width, small.height]).toEqual([640, 480]);
    expect([large.width, large.height]).toEqual([1280, 960]);
  });

  it("rejects unsupported uploads", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "bandland-media-"));
    createdDirectories.push(root);
    process.env.MEDIA_DIR = root;
    vi.resetModules();
    const { processMediaUpload } = await import("./media-store");

    await expect(
      processMediaUpload(new File(["not an image"], "poster.svg", { type: "image/svg+xml" })),
    ).rejects.toThrow(/JPEG, PNG, or WebP/);
  });

  it("rejects invalid image data even when the MIME type is accepted", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "bandland-media-"));
    createdDirectories.push(root);
    process.env.MEDIA_DIR = root;
    vi.resetModules();
    const { processMediaUpload } = await import("./media-store");

    const source = Buffer.from("not an image");
    const file = new File([source], "poster.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () =>
        source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
    });

    await expect(processMediaUpload(file)).rejects.toThrow(/not a valid image/);
  });

  it("archives responsive variants when an image is replaced", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "bandland-media-"));
    const historyRoot = path.join(root, ".history");
    createdDirectories.push(root);
    process.env.MEDIA_DIR = root;
    process.env.MEDIA_HISTORY_DIR = historyRoot;
    vi.resetModules();
    const { archiveManagedMedia, getMediaPath, processMediaUpload } = await import("./media-store");
    const source = await sharp({
      create: { width: 900, height: 500, channels: 3, background: "#111111" },
    })
      .jpeg()
      .toBuffer();
    const file = new File([source], "poster.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () =>
        source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
    });

    const imageId = await processMediaUpload(file);
    await archiveManagedMedia(imageId as string);

    await expect(fs.stat(getMediaPath(imageId as string, 640))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(await fs.readdir(historyRoot)).toHaveLength(2);
  });

  it("removes temporary files when publishing a variant fails", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "bandland-media-"));
    createdDirectories.push(root);
    process.env.MEDIA_DIR = root;
    vi.resetModules();
    const rename = vi.spyOn(fs, "rename").mockRejectedValueOnce(new Error("rename failed"));
    const { processMediaUpload } = await import("./media-store");
    const source = await sharp({
      create: { width: 900, height: 500, channels: 3, background: "#111111" },
    })
      .jpeg()
      .toBuffer();
    const file = new File([source], "poster.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () =>
        source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
    });

    await expect(processMediaUpload(file)).rejects.toThrow(/could not be processed/);
    expect(rename).toHaveBeenCalledOnce();
    expect((await fs.readdir(root)).filter((entry) => entry.endsWith(".tmp"))).toEqual([]);
  });
});
