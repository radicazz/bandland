import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MerchCarousel } from "./MerchCarousel";
import type { MerchItem } from "@/content/schema";
import { translations } from "@/i18n/translations";

afterEach(() => {
  cleanup();
});

function createMerchItem(overrides: Partial<MerchItem>): MerchItem {
  return {
    id: "0296efd8-140d-4307-b2b1-bf492bc6fe60",
    name: "Limited Edition Vinyl",
    description: "180g press with lyric insert.",
    price: "R650",
    href: "https://example.com/merch/vinyl",
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T00:00:00Z",
    ...overrides,
  };
}

describe("MerchCarousel", () => {
  it("renders a branded fallback when merch imagery is placeholder content", () => {
    render(
      <MerchCarousel
        items={[
          createMerchItem({
            imageUrl: "https://example.com/images/merch/vinyl.jpg",
          }),
        ]}
        labels={translations.en.home}
      />,
    );

    expect(screen.getByText(translations.en.home.storeFallbackLabel)).toBeInTheDocument();
    expect(screen.getByText(translations.en.home.storeFallbackDescription)).toBeInTheDocument();
    expect(screen.getAllByText("Limited Edition Vinyl")).toHaveLength(2);
  });
});
