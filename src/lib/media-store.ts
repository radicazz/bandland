import "server-only";

import { del, head } from "@vercel/blob";

import { getDataNamespace } from "@/lib/runtime-environment";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export class MediaValidationError extends Error {}

function getMediaToken() {
  const token = process.env.MEDIA_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error("MEDIA_BLOB_READ_WRITE_TOKEN is not configured.");
  }
  return token;
}

export function getMediaUploadPrefix(entity: "shows" | "merch") {
  return `media/${getDataNamespace()}/${entity}/`;
}

export async function validateManagedMedia(url: string, entity: "shows" | "merch") {
  let metadata;
  try {
    metadata = await head(url, { token: getMediaToken() });
  } catch {
    throw new MediaValidationError("The uploaded image could not be verified.");
  }

  if (!metadata.pathname.startsWith(getMediaUploadPrefix(entity))) {
    throw new MediaValidationError("The uploaded image is from the wrong storage area.");
  }
  if (
    !ACCEPTED_MEDIA_TYPES.includes(metadata.contentType as (typeof ACCEPTED_MEDIA_TYPES)[number])
  ) {
    throw new MediaValidationError("Choose a JPEG, PNG, or WebP image.");
  }
  if (metadata.size > MAX_UPLOAD_BYTES) {
    throw new MediaValidationError("Image must be 10 MB or smaller.");
  }

  return metadata.url;
}

export async function discardManagedMedia(url: string | undefined) {
  if (!url) return;
  try {
    await head(url, { token: getMediaToken() });
    await del(url, { token: getMediaToken() });
  } catch (error) {
    console.error("[Media] Unable to delete managed image", error);
  }
}
