"use client";

import { upload } from "@vercel/blob/client";

import type { AdminFormState } from "@/lib/admin-form-state";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeFileName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image"
  );
}

export async function submitAdminFormWithImage({
  action,
  previousState,
  formData,
  uploadPrefix,
}: {
  action: (previousState: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  previousState: AdminFormState;
  formData: FormData;
  uploadPrefix: string;
}): Promise<AdminFormState> {
  const value = formData.get("image");
  if (value instanceof File && value.size > 0) {
    if (!ACCEPTED_TYPES.has(value.type)) {
      return {
        status: "error",
        message: "Please choose a different image.",
        fieldErrors: { image: "Choose a JPEG, PNG, or WebP image." },
      };
    }
    if (value.size > MAX_UPLOAD_BYTES) {
      return {
        status: "error",
        message: "Please choose a different image.",
        fieldErrors: { image: "Image must be 10 MB or smaller." },
      };
    }

    try {
      const blob = await upload(
        `${uploadPrefix}${crypto.randomUUID()}-${safeFileName(value.name)}`,
        value,
        {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        },
      );
      formData.set("uploadedImageUrl", blob.url);
    } catch (error) {
      console.error("[Admin] Image upload failed", error);
      return {
        status: "error",
        message: "The image could not be uploaded. Check the connection and try again.",
        fieldErrors: { image: "Upload failed." },
      };
    }
  }

  formData.delete("image");
  return action(previousState, formData);
}
