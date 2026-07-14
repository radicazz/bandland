import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImageUploadField } from "./ImageUploadField";

describe("ImageUploadField", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("marks an existing image for removal and allows undoing it", () => {
    const currentImageUrl = "https://store.public.blob.vercel-storage.com/media/poster.webp";
    const onPreviewChange = vi.fn();
    const { container } = render(
      <ImageUploadField
        label="Show photo"
        currentImageUrl={currentImageUrl}
        onPreviewChange={onPreviewChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(container.querySelector('input[name="removeImage"]')).toHaveValue("true");
    expect(screen.getByText(/will be removed/i)).toBeInTheDocument();
    expect(onPreviewChange).toHaveBeenLastCalledWith(undefined);

    fireEvent.click(screen.getByRole("button", { name: "Keep photo" }));
    expect(container.querySelector('input[name="removeImage"]')).not.toBeInTheDocument();
    expect(onPreviewChange).toHaveBeenLastCalledWith(currentImageUrl);
  });

  it("previews a selected supported file", () => {
    const onPreviewChange = vi.fn();
    render(
      <ImageUploadField
        label="Show photo"
        previewVariant="poster"
        onPreviewChange={onPreviewChange}
      />,
    );
    const input = screen.getByLabelText(/choose a photo/i);
    const file = new File(["image"], "poster.webp", { type: "image/webp" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("poster.webp")).toBeInTheDocument();
    const preview = screen.getByRole("img", { name: "New upload preview" });
    expect(preview).toHaveAttribute("src", "blob:preview");
    expect(preview).toHaveClass("object-contain");
    expect(preview.parentElement).toHaveClass("aspect-[2/3]");
    expect(onPreviewChange).toHaveBeenCalledWith("blob:preview");
  });
});
