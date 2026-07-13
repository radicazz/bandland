import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

export const MEDIA_SIZES = [640, 1280] as const;
export type MediaSize = (typeof MEDIA_SIZES)[number];

const MEDIA_ROOT = process.env.MEDIA_DIR?.trim() || path.resolve("content", "media");
const MEDIA_HISTORY_ROOT =
  process.env.MEDIA_HISTORY_DIR?.trim() || path.join(MEDIA_ROOT, ".history");
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_INPUT_PIXELS = 25_000_000;
const MAX_ARCHIVED_FILES = 100;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class MediaValidationError extends Error {}

export function getMediaRoot() {
  return MEDIA_ROOT;
}

export function getMediaHistoryRoot() {
  return MEDIA_HISTORY_ROOT;
}

export function getMediaFileName(imageId: string, size: MediaSize) {
  return `${imageId}-${size}.webp`;
}

export function getMediaPath(imageId: string, size: MediaSize) {
  return path.join(MEDIA_ROOT, getMediaFileName(imageId, size));
}

export function getMediaUrl(imageId: string, size: MediaSize = 1280) {
  return `/media/${imageId}/${size}.webp`;
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

async function pruneMediaHistory() {
  const entries = await fs.readdir(MEDIA_HISTORY_ROOT).catch(() => []);
  if (entries.length <= MAX_ARCHIVED_FILES) {
    return;
  }

  const files = await Promise.all(
    entries.map(async (name) => ({
      name,
      mtime: (await fs.stat(path.join(MEDIA_HISTORY_ROOT, name))).mtimeMs,
    })),
  );
  files.sort((a, b) => a.mtime - b.mtime);
  await Promise.all(
    files
      .slice(0, files.length - MAX_ARCHIVED_FILES)
      .map(({ name }) => fs.unlink(path.join(MEDIA_HISTORY_ROOT, name))),
  );
}

export async function processMediaUpload(value: FormDataEntryValue | null) {
  if (!isUploadedFile(value)) {
    return null;
  }
  if (!ACCEPTED_TYPES.has(value.type)) {
    throw new MediaValidationError("Choose a JPEG, PNG, or WebP image.");
  }
  if (value.size > MAX_UPLOAD_BYTES) {
    throw new MediaValidationError("Image must be smaller than 10 MB.");
  }

  const input = Buffer.from(await value.arrayBuffer());
  const image = sharp(input, {
    failOn: "warning",
    limitInputPixels: MAX_INPUT_PIXELS,
  });

  let metadata: Metadata;
  try {
    metadata = await image.metadata();
  } catch {
    throw new MediaValidationError("The selected file is not a valid image.");
  }
  if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) {
    throw new MediaValidationError("Animated or unreadable images are not supported.");
  }

  const imageId = randomUUID();
  await Promise.all([
    fs.mkdir(MEDIA_ROOT, { recursive: true }),
    fs.mkdir(MEDIA_HISTORY_ROOT, { recursive: true }),
  ]);
  const createdPaths: string[] = [];

  try {
    for (const size of MEDIA_SIZES) {
      const finalPath = getMediaPath(imageId, size);
      const temporaryPath = `${finalPath}.${randomUUID()}.tmp`;
      try {
        await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
          .rotate()
          .resize(size, Math.round(size * 0.75), {
            fit: "cover",
            position: sharp.strategy.attention,
          })
          .webp({ quality: 82, effort: 4 })
          .toFile(temporaryPath);
        await fs.rename(temporaryPath, finalPath);
        createdPaths.push(finalPath);
      } finally {
        await fs.unlink(temporaryPath).catch(() => undefined);
      }
    }
  } catch (error) {
    await Promise.all(createdPaths.map((filePath) => fs.unlink(filePath).catch(() => undefined)));
    if (error instanceof MediaValidationError) {
      throw error;
    }
    throw new MediaValidationError("The image could not be processed. Try another file.");
  }

  return imageId;
}

export async function discardManagedMedia(imageId: string) {
  await Promise.all(
    MEDIA_SIZES.map((size) => fs.unlink(getMediaPath(imageId, size)).catch(() => undefined)),
  );
}

export async function archiveManagedMedia(imageId: string) {
  await fs.mkdir(MEDIA_HISTORY_ROOT, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await Promise.all(
    MEDIA_SIZES.map(async (size) => {
      const source = getMediaPath(imageId, size);
      const destination = path.join(
        MEDIA_HISTORY_ROOT,
        `${timestamp}-${getMediaFileName(imageId, size)}`,
      );
      await fs.rename(source, destination).catch((error: unknown) => {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
          return;
        }
        throw error;
      });
    }),
  );
  await pruneMediaHistory();
}
