import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeZine } from "./HomeZine";
import { createSimulatedPlayback, type PlaybackSignal } from "@/components/guitar/playback";
import { PlaybackProvider, usePlayback } from "@/components/guitar/PlaybackProvider";
import type { MerchItem, Show, SiteSettings, WidgetSetting } from "@/content/schema";
import { getDefaultSettings } from "@/content/settings-defaults";
import { translations } from "@/i18n/translations";

const getShowsMock = vi.hoisted(() => vi.fn<() => Promise<Show[]>>());
const getMerchItemsMock = vi.hoisted(() => vi.fn<() => Promise<MerchItem[]>>());

vi.mock("@/content/shows", () => ({ getShows: getShowsMock }));
vi.mock("@/content/merch", () => ({ getMerchItems: getMerchItemsMock }));

const labels = translations.en;
const simulated = () => createSimulatedPlayback();

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  // jsdom has no 2D canvas; the hero waveform just skips drawing.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  getShowsMock.mockReset();
  getMerchItemsMock.mockReset();
  getShowsMock.mockResolvedValue([]);
  getMerchItemsMock.mockResolvedValue([]);
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

function createMerch(overrides: Partial<MerchItem>): MerchItem {
  return {
    id: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    name: "Tour shirt",
    price: "R250",
    href: "https://store.example.com/shirt",
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T16:47:08.839Z",
    ...overrides,
  };
}

function withWidgets(
  enabled: Partial<Record<WidgetSetting["id"], boolean>>,
  order?: WidgetSetting["id"][],
) {
  const settings: SiteSettings = getDefaultSettings();
  settings.widgets = settings.widgets.map((widget) => ({
    ...widget,
    enabled: enabled[widget.id] ?? widget.enabled,
  }));
  if (order) {
    settings.widgets.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
  return settings;
}

// The root layout owns playback; the page renders inside it.
async function renderHome(settings: SiteSettings = getDefaultSettings()) {
  return render(
    <PlaybackProvider createDriver={simulated}>
      {await HomeZine({ labels, locale: "en", settings })}
    </PlaybackProvider>,
  );
}

const section = (id: string) =>
  document.querySelector<HTMLElement>(`section[aria-labelledby="home-${id}"]`);

/** Section ids in document order (hero first). */
function order(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("section[aria-labelledby]")).map(
    (element) => element.getAttribute("aria-labelledby")?.replace("home-", "") ?? "",
  );
}

describe("HomeZine", () => {
  it("renders one h1 wordmark, the play control and every enabled section", async () => {
    getMerchItemsMock.mockResolvedValue([createMerch({})]);
    const { container } = await renderHome();

    const [h1, ...rest] = screen.getAllByRole("heading", { level: 1 });
    expect(rest).toHaveLength(0);
    expect(h1).toHaveTextContent("schmät");
    expect(screen.getByRole("button", { name: labels.home.journey.play })).toBeInTheDocument();
    // Default widget order: release, nextShow, merch; socials close the page.
    expect(order(container)).toEqual(["title", "release", "show", "merch", "links"]);
    // The fret strip is decoration only.
    expect(container.querySelector(".fret-strip")).toHaveAttribute("aria-hidden", "true");
  });

  it("uses the settings tagline and falls back to the site description", async () => {
    await renderHome();
    expect(screen.getByText(labels.meta.description)).toBeInTheDocument();
    cleanup();

    const settings = getDefaultSettings();
    settings.hero.tagline = "Skollie punk from the Cape";
    await renderHome(settings);
    expect(screen.getByText("Skollie punk from the Cape")).toBeInTheDocument();
  });

  it("gives the band photos meaningful alt text and hides the detail crops", async () => {
    await renderHome();
    expect(screen.getAllByAltText(labels.home.photos.guitarist).length).toBeGreaterThan(0);
    expect(screen.getAllByAltText(labels.home.photos.drummer).length).toBeGreaterThan(0);
    for (const image of screen.getAllByRole("img")) {
      expect(image.getAttribute("alt")).not.toBeNull();
    }
    expect(screen.getByRole("list", { name: labels.home.photosLabel })).toBeInTheDocument();
  });

  it("headlines the next upcoming show's venue with date, city and tickets", async () => {
    getShowsMock.mockResolvedValue([
      createShow({
        id: "03122c83-28e1-4382-b738-c4cbc442ea3a",
        date: "2099-06-08T20:00:00+02:00",
        venue: "Armchair Theatre",
        ticketUrl: "https://tickets.example.com/armchair",
      }),
      createShow({ venue: "Smoking Kills", ticketUrl: "https://tickets.example.com/smoking" }),
      createShow({
        id: "faf2fd84-a901-4054-b87d-c8d4765024fe",
        date: "2026-03-01T20:00:00+02:00",
        venue: "Old Show",
        hasHappened: true,
      }),
    ]);
    await renderHome();

    const show = section("show") as HTMLElement;
    expect(within(show).getByRole("heading", { level: 2, name: "Smoking Kills" })).toBeVisible();
    expect(show).toHaveTextContent("Cape Town, WC");
    const time = show.querySelector("time");
    expect(time).toHaveAttribute("dateTime", "2099-06-01T20:00:00+02:00");
    expect(time).toHaveTextContent("20:00");
    expect(within(show).getByRole("link", { name: /^Tickets: Smoking Kills/ })).toHaveAttribute(
      "href",
      "https://tickets.example.com/smoking",
    );
    expect(screen.queryByText("Armchair Theatre")).not.toBeInTheDocument();
    expect(screen.queryByText("Old Show")).not.toBeInTheDocument();
  });

  it("links to /shows instead of tickets when the ticket URL is missing or not https", async () => {
    getShowsMock.mockResolvedValue([createShow({ ticketUrl: "http://insecure.example.com" })]);
    await renderHome();

    const show = section("show") as HTMLElement;
    expect(within(show).queryByRole("link", { name: /^Tickets/ })).not.toBeInTheDocument();
    expect(within(show).getByRole("link", { name: labels.home.allShowsCta })).toHaveAttribute(
      "href",
      "/shows",
    );
  });

  it("shows a 'no shows announced' state with a link when nothing is upcoming", async () => {
    getShowsMock.mockResolvedValue([
      createShow({ date: "2026-03-01T20:00:00+02:00", venue: "Old Show", hasHappened: true }),
    ]);
    await renderHome();

    const show = section("show") as HTMLElement;
    expect(within(show).getByRole("heading", { name: labels.home.noShowsTitle })).toBeVisible();
    expect(within(show).getByRole("link", { name: labels.home.allShowsCta })).toHaveAttribute(
      "href",
      "/shows",
    );
  });

  it("degrades to the no-shows state when show storage rejects", async () => {
    getShowsMock.mockRejectedValue(new Error("blob down"));
    await renderHome();
    expect(screen.getByText(labels.home.noShowsTitle)).toBeInTheDocument();
  });

  it("renders up to three merch items and drops the block when storage rejects", async () => {
    getMerchItemsMock.mockResolvedValue(
      Array.from({ length: 4 }, (_, index) =>
        createMerch({
          id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
          name: `Item ${index}`,
        }),
      ),
    );
    await renderHome();
    const merch = section("merch") as HTMLElement;
    expect(within(merch).getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.queryByText("Item 3")).not.toBeInTheDocument();
    expect(within(merch).getByRole("link", { name: /All merch/ })).toHaveAttribute(
      "href",
      "/merch",
    );
    cleanup();

    getMerchItemsMock.mockRejectedValue(new Error("blob down"));
    await renderHome();
    expect(section("merch")).toBeNull();
  });

  it("skips disabled widgets without reading their storage", async () => {
    getMerchItemsMock.mockResolvedValue([createMerch({})]);
    const { container } = await renderHome(
      withWidgets({ nextShow: false, release: false, merch: false }),
    );

    expect(order(container)).toEqual(["title", "links"]);
    expect(getShowsMock).not.toHaveBeenCalled();
    expect(getMerchItemsMock).not.toHaveBeenCalled();
    // The photo row is band identity, not a widget: it stays.
    expect(screen.getByRole("list", { name: labels.home.photosLabel })).toBeInTheDocument();
  });

  it("follows the admin widget order", async () => {
    getMerchItemsMock.mockResolvedValue([createMerch({})]);
    const merchFirst = await renderHome(withWidgets({}, ["merch", "release", "nextShow"]));
    expect(order(merchFirst.container)).toEqual(["title", "merch", "release", "show", "links"]);
    cleanup();

    const showLast = await renderHome(withWidgets({}, ["release", "merch", "nextShow"]));
    // Release and show share the panel row, so the show stays beside the release.
    expect(order(showLast.container)).toEqual(["title", "release", "show", "merch", "links"]);
  });

  it("renders the release title, description and listen link from settings", async () => {
    const settings = getDefaultSettings();
    settings.release = {
      title: "Pappa soek 'n Porsche",
      description: "Out now everywhere.",
      href: "https://example.com/listen",
    };
    await renderHome(settings);

    const release = section("release") as HTMLElement;
    expect(
      within(release).getByRole("heading", { level: 2, name: "Pappa soek 'n Porsche" }),
    ).toBeVisible();
    expect(within(release).getByText(labels.home.releaseKicker)).toBeInTheDocument();
    expect(within(release).getByText("Out now everywhere.")).toBeInTheDocument();
    expect(
      within(release).getByRole("link", { name: new RegExp(labels.home.latestReleaseCta) }),
    ).toHaveAttribute("href", "https://example.com/listen");
    expect(release.querySelector("iframe")).toBeNull();
  });

  it("renders the Spotify embed automatically without taking focus", async () => {
    const { container } = await renderHome();
    const embed = container.querySelector("iframe");
    expect(embed).toHaveAttribute("src", getDefaultSettings().release.embedUrl);
    expect(embed).toHaveAttribute("loading", "lazy");
    expect(embed).not.toHaveFocus();
    expect(screen.queryByRole("button", { name: "Load Spotify player" })).not.toBeInTheDocument();
  });

  it("loads the Apple Music iframe after the visitor requests it", async () => {
    const settings = getDefaultSettings();
    settings.release.embedUrl = "https://embed.music.apple.com/za/album/example/123";
    const { container } = await renderHome(settings);
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Load Apple Music player" }));
    expect(container.querySelector("iframe")).toHaveAttribute("src", settings.release.embedUrl);
  });

  it("lists https socials as external links", async () => {
    const settings = getDefaultSettings();
    settings.socials = [{ label: "Instagram", href: "https://instagram.com/schmat" }];
    await renderHome(settings);
    const links = section("links") as HTMLElement;
    expect(within(links).getByRole("link", { name: /^Instagram/ })).toHaveAttribute(
      "href",
      "https://instagram.com/schmat",
    );
    cleanup();

    settings.socials = [];
    await renderHome(settings);
    expect(section("links")).toBeNull();
  });

  it("keeps the live signal across a remount", async () => {
    // Navigating away and back unmounts the page under the layout's single provider.
    let signal: PlaybackSignal | null = null;
    function Probe() {
      const current = usePlayback();
      useEffect(() => {
        signal = current;
      }, [current]);
      return null;
    }
    const page = await HomeZine({ labels, locale: "en", settings: getDefaultSettings() });
    const tree = (content: React.ReactNode) => (
      <PlaybackProvider createDriver={simulated}>
        <Probe />
        {content}
      </PlaybackProvider>
    );
    const { rerender } = render(tree(page));
    fireEvent.click(screen.getByRole("button", { name: labels.home.journey.play }));

    rerender(tree(null));
    rerender(tree(page));

    expect((signal as PlaybackSignal | null)?.playing).toBe(true);
    expect(screen.getByRole("button", { name: labels.home.journey.pause })).toBeInTheDocument();
  });
});
