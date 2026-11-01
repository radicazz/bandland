import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeFeatures } from "./HomeFeatures";
import type { Show } from "@/content/schema";
import { translations } from "@/i18n/translations";
import { site } from "@/config/site";
import { getDefaultSettings } from "@/content/settings-defaults";

const getShowsMock = vi.hoisted(() => vi.fn<() => Promise<Show[]>>());

vi.mock("@/content/shows", () => ({
  getShows: getShowsMock,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  getShowsMock.mockReset();
});

function createShow(overrides: Partial<Show>): Show {
  return {
    id: "70164137-f515-40b9-be69-d059f433bf21",
    date: "2099-06-01T20:00:00+02:00",
    hasHappened: false,
    venue: "Mercury Live",
    city: "Cape Town, WC",
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T16:47:08.839Z",
    ...overrides,
  };
}

describe("HomeFeatures", () => {
  it("prioritizes the next show and shows direct ticket plus schedule links", async () => {
    getShowsMock.mockResolvedValue([
      createShow({
        id: "70164137-f515-40b9-be69-d059f433bf21",
        date: "2099-06-01T20:00:00+02:00",
        venue: "Mercury Live",
        ticketUrl: "https://tickets.example.com/mercury",
        priceOnline: "R180",
        priceDoor: "R220",
      }),
      createShow({
        id: "03122c83-28e1-4382-b738-c4cbc442ea3a",
        date: "2099-06-08T20:00:00+02:00",
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

    render(await HomeFeatures({ labels: translations.en, locale: "en" }));

    expect(screen.getByText(translations.en.home.nextShowLabel)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mercury Live" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: translations.en.home.ticketsCta })).toHaveAttribute(
      "href",
      "https://tickets.example.com/mercury",
    );
    expect(screen.getByRole("link", { name: translations.en.home.allShowsCta })).toHaveAttribute(
      "href",
      "/shows",
    );
    expect(screen.queryByText("Armchair Theatre")).not.toBeInTheDocument();
    expect(screen.queryByText("Old Show")).not.toBeInTheDocument();
    expect(screen.getByText(translations.en.home.releaseLabel)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: site.latestRelease.title })).toBeInTheDocument();
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

    render(await HomeFeatures({ labels: translations.en, locale: "en" }));

    expect(
      screen.getByRole("heading", { name: translations.en.home.nextShowFallbackTitle }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: translations.en.home.allShowsCta })).toHaveAttribute(
      "href",
      "/shows",
    );
    expect(screen.getByText(translations.en.home.releaseLabel)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: new RegExp(translations.en.nav.merch, "i") }),
    ).toHaveAttribute("href", "/merch");
  });

  it("renders widgets in the configured order, skips disabled ones and uses release overrides", async () => {
    getShowsMock.mockResolvedValue([]);
    const settings = getDefaultSettings();
    settings.widgets = [
      { id: "release", enabled: true, width: "full" },
      { id: "nextShow", enabled: false, width: "half" },
      { id: "merch", enabled: true, width: "half" },
    ];
    settings.release = {
      title: "Brand new single",
      description: "Out now everywhere.",
      href: "https://example.com/listen",
    };

    const { container } = render(
      await HomeFeatures({ labels: translations.en, locale: "en", settings }),
    );

    const headings = screen.getAllByRole("heading").map((heading) => heading.textContent);
    expect(headings).toEqual(["Brand new single"]);
    expect(screen.queryByText(translations.en.home.nextShowLabel)).not.toBeInTheDocument();
    expect(screen.getByText("Out now everywhere.")).toBeInTheDocument();
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: /Listen/ })).toHaveAttribute(
      "href",
      "https://example.com/listen",
    );
    expect(container.firstElementChild?.children[0]).toHaveClass("lg:col-span-2");
    expect(getShowsMock).not.toHaveBeenCalled();
  });
});
