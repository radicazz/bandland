import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeCarousel } from "./HomeCarousel";
import type { MerchItem, Show } from "@/content/schema";
import { translations } from "@/i18n/translations";

const getMerchItemsMock = vi.hoisted(() => vi.fn<() => Promise<MerchItem[]>>());
const getShowsMock = vi.hoisted(() => vi.fn<() => Promise<Show[]>>());

vi.mock("@/content/merch", () => ({
  getMerchItems: getMerchItemsMock,
}));

vi.mock("@/content/shows", () => ({
  getShows: getShowsMock,
}));

vi.mock("@/components/MerchCarousel", () => ({
  MerchCarousel: ({ labels }: { labels: typeof translations.en.home }) => (
    <div>{labels.storeTitle}</div>
  ),
}));

vi.mock("@/components/ReleasePlayerTabs", () => ({
  ReleasePlayerTabs: () => <div>Release tabs</div>,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  getMerchItemsMock.mockReset();
  getShowsMock.mockReset();
  getMerchItemsMock.mockResolvedValue([]);
});

function createShow(overrides: Partial<Show>): Show {
  return {
    id: "70164137-f515-40b9-be69-d059f433bf21",
    date: "2026-04-05T20:00:00+02:00",
    hasHappened: false,
    venue: "Mercury Live",
    city: "Cape Town, WC",
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T16:47:08.839Z",
    ...overrides,
  };
}

describe("HomeCarousel", () => {
  it("prioritizes the next show and shows direct ticket plus schedule links", async () => {
    getShowsMock.mockResolvedValue([
      createShow({
        id: "70164137-f515-40b9-be69-d059f433bf21",
        date: "2026-04-05T20:00:00+02:00",
        venue: "Mercury Live",
        ticketUrl: "https://tickets.example.com/mercury",
        priceOnline: "R180",
        priceDoor: "R220",
      }),
      createShow({
        id: "03122c83-28e1-4382-b738-c4cbc442ea3a",
        date: "2026-04-12T20:00:00+02:00",
        venue: "Armchair Theatre",
        city: "Cape Town, WC",
        ticketUrl: "https://tickets.example.com/armchair",
      }),
      createShow({
        id: "faf2fd84-a901-4054-b87d-c8d4765024fe",
        date: "2026-03-01T20:00:00+02:00",
        venue: "Old Show",
        hasHappened: true,
      }),
    ]);

    render(await HomeCarousel({ labels: translations.en, locale: "en" }));

    expect(screen.getByText(translations.en.home.nextShowLabel)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mercury Live" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: translations.en.home.ticketsCta }),
    ).toHaveAttribute("href", "https://tickets.example.com/mercury");
    expect(
      screen.getByRole("link", { name: translations.en.home.allShowsCta }),
    ).toHaveAttribute("href", "/shows");
    expect(screen.getByText(translations.en.home.upcomingListTitle)).toBeInTheDocument();
    expect(screen.getByText("Armchair Theatre")).toBeInTheDocument();
    expect(screen.queryByText("Old Show")).not.toBeInTheDocument();
    expect(screen.getByText(translations.en.home.releaseLabel)).toBeInTheDocument();
  });

  it("renders a no-upcoming fallback while keeping secondary content", async () => {
    getShowsMock.mockResolvedValue([
      createShow({
        id: "faf2fd84-a901-4054-b87d-c8d4765024fe",
        date: "2026-03-01T20:00:00+02:00",
        venue: "Old Show",
        hasHappened: true,
      }),
    ]);

    render(await HomeCarousel({ labels: translations.en, locale: "en" }));

    expect(
      screen.getByRole("heading", { name: translations.en.home.nextShowFallbackTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: translations.en.home.allShowsCta }),
    ).toHaveAttribute("href", "/shows");
    expect(screen.queryByText(translations.en.home.upcomingListTitle)).not.toBeInTheDocument();
    expect(screen.getByText(translations.en.home.releaseLabel)).toBeInTheDocument();
    expect(screen.getByText(translations.en.home.storeTitle)).toBeInTheDocument();
  });
});
