import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadMock = vi.hoisted(() => vi.fn());
vi.mock("@vercel/blob/client", () => ({ upload: uploadMock }));

import { initialAdminFormState } from "@/lib/admin-form-state";
import { submitAdminFormWithImage } from "@/lib/admin-image-upload";

describe("direct admin image uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", { randomUUID: () => "70164137-f515-40b9-be69-d059f433bf21" });
    uploadMock.mockResolvedValue({
      url: "https://store.public.blob.vercel-storage.com/media/poster.webp",
    });
  });

  it("sends a file larger than the function limit directly to Blob", async () => {
    const formData = new FormData();
    formData.set(
      "image",
      new File([new Uint8Array(5 * 1024 * 1024)], "Poster Photo.webp", {
        type: "image/webp",
      }),
    );
    const action = vi.fn(async (_state, submitted: FormData) => {
      expect(submitted.get("image")).toBeNull();
      expect(submitted.get("uploadedImageUrl")).toBe(
        "https://store.public.blob.vercel-storage.com/media/poster.webp",
      );
      return { status: "idle" as const };
    });

    await submitAdminFormWithImage({
      action,
      previousState: initialAdminFormState,
      formData,
      uploadPrefix: "media/development/shows/",
    });

    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringContaining("media/development/shows/70164137-f515-40b9-be69-d059f433bf21"),
      expect.any(File),
      { access: "public", handleUploadUrl: "/api/blob/upload" },
    );
  });

  it("rejects files above 10 MB before requesting a token", async () => {
    const formData = new FormData();
    formData.set(
      "image",
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {
        type: "image/png",
      }),
    );

    const result = await submitAdminFormWithImage({
      action: vi.fn(),
      previousState: initialAdminFormState,
      formData,
      uploadPrefix: "media/development/shows/",
    });

    expect(result.fieldErrors?.image).toMatch(/10 MB/);
    expect(uploadMock).not.toHaveBeenCalled();
  });
});
