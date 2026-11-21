import "server-only";

import { head } from "@vercel/blob";

import { getMediaHost, isManagedMediaUrl } from "@/config/media";
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
  const token = getMediaToken();
  const prefix = getMediaUploadPrefix(entity);
  if (!isManagedMediaUrl(url, getMediaHost(token), `/${prefix}`)) {
    throw new MediaValidationError("The uploaded image is from the wrong storage area.");
  }
  let metadata;
  try {
    metadata = await head(url, { token });
  } catch {
    throw new MediaValidationError("The uploaded image could not be verified.");
  }

  if (
    !metadata.pathname.startsWith(prefix) ||
    !isManagedMediaUrl(metadata.url, getMediaHost(token), `/${prefix}`)
  ) {
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
