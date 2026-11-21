import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContentImage } from "./ContentImage";

const commonProps = {
  alt: "Show poster",
  className: "image",
  fallbackClassName: "fallback",
  fallbackLabel: "Image unavailable",
};

afterEach(() => vi.unstubAllEnvs());

describe("ContentImage", () => {
  it("recovers when a failed source is replaced", () => {
    const { rerender } = render(<ContentImage src="/broken.jpg" {...commonProps} />);
    fireEvent.error(screen.getByRole("img", { name: "Show poster" }));
    expect(screen.getByText("Image unavailable")).toBeInTheDocument();

    rerender(<ContentImage src="/working.jpg" {...commonProps} />);
    expect(screen.getByRole("img", { name: "Show poster" })).toHaveAttribute("src", "/working.jpg");
  });

  it("renders a Vercel Blob image through Next Image", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_HOST", "store.public.blob.vercel-storage.com");
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
