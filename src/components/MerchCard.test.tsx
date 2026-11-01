import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MerchCard } from "@/components/MerchCard";
import { translations } from "@/i18n/translations";
import type { MerchItem } from "@/content/schema";

afterEach(cleanup);

const item: MerchItem = {
  id: "70164137-f515-40b9-be69-d059f433bf21",
  name: "Schmät tour T-shirt with a longer product name",
  price: "R450",
  description: "Tour artwork on a black cotton shirt.",
  href: "https://store.example.com/shirt",
  createdAt: "2026-01-21T00:00:00Z",
  updatedAt: "2026-01-21T00:00:00Z",
};

describe("MerchCard", () => {
  it("keeps product details and a named store link available without an image", () => {
    render(<MerchCard item={item} labels={translations.af.merch} />);
    expect(screen.getByRole("heading", { name: item.name })).toBeInTheDocument();
    expect(screen.getByText(item.price)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: `Bekyk: ${item.name} (opens in a new tab)` }),
    ).toHaveAttribute("href", item.href);
  });

  it("preserves the image frame and store action when a product photo fails", () => {
    render(
      <MerchCard
        item={{ ...item, imageUrl: "https://store.public.blob.vercel-storage.com/shirt.webp" }}
        labels={translations.en.merch}
      />,
    );
    fireEvent.error(screen.getByRole("img", { name: item.name }));
    expect(screen.getByRole("img", { name: item.name })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: `View: ${item.name} (opens in a new tab)` }),
    ).toHaveAttribute("href", item.href);
  });

  it("shows a sold-out label", () => {
    render(<MerchCard item={{ ...item, badge: "sold-out" }} labels={translations.en.merch} />);
    expect(screen.getByText("Sold out")).toBeInTheDocument();
  });
});
