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

  it("renders managed responsive sources", () => {
    const { container } = render(
      <ContentImage imageId="70164137-f515-40b9-be69-d059f433bf21" {...commonProps} />,
    );
    expect(container.querySelector("source")).toHaveAttribute(
      "srcset",
      expect.stringContaining("/media/70164137-f515-40b9-be69-d059f433bf21/640.webp"),
    );
  });
});
