import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContentImage } from "./ContentImage";

const commonProps = {
  alt: "Show poster",
  className: "image",
  fallbackClassName: "fallback",
  fallbackLabel: "Image unavailable",
};

describe("ContentImage", () => {
  it("recovers when a failed source is replaced", () => {
    const { rerender } = render(
      <ContentImage src="https://images.test/broken.jpg" {...commonProps} />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Show poster" }));
    expect(screen.getByText("Image unavailable")).toBeInTheDocument();

    rerender(<ContentImage src="https://images.test/working.jpg" {...commonProps} />);
    expect(screen.getByRole("img", { name: "Show poster" })).toHaveAttribute(
      "src",
      "https://images.test/working.jpg",
    );
  });

  it("renders a Vercel Blob image through Next Image", () => {
    const { container } = render(
      <ContentImage
        src="https://store.public.blob.vercel-storage.com/media/poster.webp"
        {...commonProps}
      />,
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("store.public.blob.vercel-storage.com"),
    );
  });
});
