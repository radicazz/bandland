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
    const { container } = render(
      <ImageUploadField label="Show photo" currentImageId="70164137-f515-40b9-be69-d059f433bf21" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(container.querySelector('input[name="removeImage"]')).toHaveValue("true");
    expect(screen.getByText(/will be removed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keep photo" }));
    expect(container.querySelector('input[name="removeImage"]')).not.toBeInTheDocument();
  });

  it("previews a selected supported file", () => {
    render(<ImageUploadField label="Merch photo" />);
    const input = screen.getByLabelText(/choose a photo/i);
    const file = new File(["image"], "poster.webp", { type: "image/webp" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("poster.webp")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "New upload preview" })).toHaveAttribute(
      "src",
      "blob:preview",
    );
  });
});
