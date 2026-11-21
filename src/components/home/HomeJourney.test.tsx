import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeJourney } from "./HomeJourney";
import { proceduralAnchors } from "@/components/guitar/guitarModel";
import { createSimulatedPlayback, type PlaybackSignal } from "@/components/guitar/playback";
import { PlaybackProvider, usePlayback } from "@/components/guitar/PlaybackProvider";
import type { MerchItem, Show, SiteSettings } from "@/content/schema";
import { getDefaultSettings } from "@/content/settings-defaults";
import { translations } from "@/i18n/translations";

const getShowsMock = vi.hoisted(() => vi.fn<() => Promise<Show[]>>());
const getMerchItemsMock = vi.hoisted(() => vi.fn<() => Promise<MerchItem[]>>());

vi.mock("@/content/shows", () => ({ getShows: getShowsMock }));
vi.mock("@/content/merch", () => ({ getMerchItems: getMerchItemsMock }));
vi.mock("@/components/guitar/GuitarStage", () => ({
  GuitarStage: function GuitarStageMock({
    route,
    litFret,
  }: {
    route: readonly string[];
    litFret: number;
  }) {
    return <div data-testid="guitar-stage" data-route={route.join(",")} data-lit-fret={litFret} />;
  },
}));

const labels = translations.en;

afterEach(() => {
  cleanup();
});

const simulated = () => createSimulatedPlayback();

beforeEach(() => {
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

function withWidgets(enabled: Partial<Record<"nextShow" | "release" | "merch", boolean>>) {
  const settings: SiteSettings = getDefaultSettings();
  settings.widgets = settings.widgets.map((widget) => ({
    ...widget,
    enabled: enabled[widget.id] ?? widget.enabled,
  }));
  return settings;
}

// The root layout owns playback; the page renders inside it.
async function renderJourney(settings: SiteSettings = getDefaultSettings()) {
  return render(
    <PlaybackProvider createDriver={simulated}>
      {await HomeJourney({ labels, locale: "en", settings })}
    </PlaybackProvider>,
  );
}

function stops(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-stop]")).map(
    (element) => element.dataset.stop ?? "",
  );
}

describe("HomeJourney", () => {
  it("renders sections in route order for default settings", async () => {
    getMerchItemsMock.mockResolvedValue([createMerch({})]);
    const { container } = await renderJourney();

    // Default widget order is nextShow, release, merch; release is always stop 2.
    expect(stops(container)).toEqual(["hero", "release", "neck", "body", "outro"]);
    expect(screen.getByTestId("guitar-stage")).toHaveAttribute(
      "data-route",
      "hero,release,neck,body,outro",
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("button", { name: labels.home.journey.play })).toBeInTheDocument();
  });

  it("hero wordmark and every stop heading are rendered in the server HTML", async () => {
    getMerchItemsMock.mockResolvedValue([createMerch({})]);
    const html = renderToString(
      <PlaybackProvider createDriver={simulated}>
        {await HomeJourney({ labels, locale: "en", settings: getDefaultSettings() })}
      </PlaybackProvider>,
    );

    expect(html).toMatch(/<h1[^>]*intro-wordmark[^>]*>/);
    for (const id of ["release", "neck", "body", "outro"]) {
      expect(html).toContain(`id="journey-${id}"`);
    }
    // Reveal wrappers hide only via the post-hydration root class, never inline.
    expect(html).toContain("data-reveal");
    expect(html).not.toMatch(/data-reveal[^>]*style=/);
  });

  it("shows the next show first with a ticket link, then following shows", async () => {
    getShowsMock.mockResolvedValue([
      createShow({
        id: "03122c83-28e1-4382-b738-c4cbc442ea3a",
        date: "2099-06-08T20:00:00+02:00",
        venue: "Armchair Theatre",
        ticketUrl: "https://tickets.example.com/armchair",
      }),
      createShow({
        venue: "Mercury Live",
        ticketUrl: "https://tickets.example.com/mercury",
      }),
      createShow({
        id: "faf2fd84-a901-4054-b87d-c8d4765024fe",
        date: "2026-03-01T20:00:00+02:00",
        venue: "Old Show",
        hasHappened: true,
      }),
    ]);
    const { container } = await renderJourney();

    const neck = container.querySelector<HTMLElement>('[data-stop="neck"]');
    expect(neck).not.toBeNull();
    const items = within(neck as HTMLElement).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const [first, second] = items as [HTMLElement, HTMLElement];
    expect(first).toHaveTextContent("Mercury Live");
    expect(first).toHaveTextContent(labels.shows.nextShowBadge);
    expect(first).toHaveAttribute("data-fret", "0");
    expect(second).toHaveTextContent("Armchair Theatre");
    expect(second).toHaveAttribute("data-fret", "1");
    expect(
      within(first).getByRole("link", { name: new RegExp(`^${labels.shows.tickets}`) }),
    ).toHaveAttribute("href", "https://tickets.example.com/mercury");
    expect(screen.queryByText("Old Show")).not.toBeInTheDocument();
    // Nothing is lit until a show row scrolls into view.
    expect(screen.getByTestId("guitar-stage")).toHaveAttribute("data-lit-fret", "-1");
  });

  it("caps neck rows at the guitar's fret count", async () => {
    const total = proceduralAnchors.fretCount + 3;
    getShowsMock.mockResolvedValue(
      Array.from({ length: total }, (_, index) =>
        createShow({
          id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
          date: `2099-06-${String(index + 1).padStart(2, "0")}T20:00:00+02:00`,
          venue: `Venue ${index}`,
        }),
      ),
    );
    const { container } = await renderJourney();

    const neck = container.querySelector<HTMLElement>('[data-stop="neck"]') as HTMLElement;
    const items = within(neck).getAllByRole("listitem");
    expect(items).toHaveLength(proceduralAnchors.fretCount);
    expect(items.at(-1)).toHaveAttribute("data-fret", String(proceduralAnchors.fretCount - 1));
    expect(screen.queryByText(`Venue ${proceduralAnchors.fretCount}`)).not.toBeInTheDocument();
    expect(within(neck).getByRole("link", { name: labels.home.allShowsCta })).toHaveAttribute(
      "href",
      "/shows",
    );
  });

  it("renders the existing fallback copy when there are no upcoming shows", async () => {
    getShowsMock.mockResolvedValue([
      createShow({ date: "2026-03-01T20:00:00+02:00", venue: "Old Show", hasHappened: true }),
    ]);
    const { container } = await renderJourney();

    const neck = container.querySelector<HTMLElement>('[data-stop="neck"]') as HTMLElement;
    expect(
      within(neck).getByRole("heading", { name: labels.home.nextShowFallbackTitle }),
    ).toBeInTheDocument();
    expect(within(neck).getByText(labels.home.nextShowFallbackDescription)).toBeInTheDocument();
    expect(within(neck).getByRole("link", { name: labels.home.allShowsCta })).toHaveAttribute(
      "href",
      "/shows",
    );
    expect(screen.getByTestId("guitar-stage")).toHaveAttribute("data-lit-fret", "-1");
  });

  it("omits the body section when merch is empty or the merch widget is disabled", async () => {
    const empty = await renderJourney();
    expect(stops(empty.container)).toEqual(["hero", "release", "neck", "outro"]);
    expect(screen.getByTestId("guitar-stage")).toHaveAttribute(
      "data-route",
      "hero,release,neck,outro",
    );
    cleanup();

    getMerchItemsMock.mockResolvedValue([createMerch({})]);
    const disabled = await renderJourney(withWidgets({ merch: false }));
    expect(stops(disabled.container)).toEqual(["hero", "release", "neck", "outro"]);
    expect(screen.getByTestId("guitar-stage")).toHaveAttribute(
      "data-route",
      "hero,release,neck,outro",
    );
    expect(screen.queryByText("Tour shirt")).not.toBeInTheDocument();
    expect(getMerchItemsMock).toHaveBeenCalledTimes(1);
  });

  it("renders without the body section when merch storage rejects", async () => {
    getMerchItemsMock.mockRejectedValue(new Error("blob down"));
    const { container } = await renderJourney();
    expect(stops(container)).toEqual(["hero", "release", "neck", "outro"]);
  });

  it("degrades to the no-shows fallback when show storage rejects", async () => {
    getShowsMock.mockRejectedValue(new Error("blob down"));
    const { container } = await renderJourney();
    expect(stops(container)).toContain("neck");
    expect(screen.getByText(labels.home.nextShowFallbackTitle)).toBeInTheDocument();
  });

  it("keeps focus targets clear of the sticky header with scroll margins", async () => {
    getMerchItemsMock.mockResolvedValue([createMerch({})]);
    const { container } = await renderJourney();
    const section = container.querySelector("[data-stop='release']");
    expect(section?.className).toContain("scroll-mt-20");
    // section → text column → padded container carrying the interactive margins
    const column = section?.parentElement?.parentElement;
    expect(column?.className).toContain("[&_button]:scroll-mt-20");
    expect(column?.className).toContain("[&_iframe]:scroll-mt-20");
  });

  it("renders merch items in the body section", async () => {
    getMerchItemsMock.mockResolvedValue([createMerch({})]);
    const { container } = await renderJourney();

    const body = container.querySelector<HTMLElement>('[data-stop="body"]') as HTMLElement;
    expect(within(body).getByText("Tour shirt")).toBeInTheDocument();
    expect(within(body).getByText("R250")).toBeInTheDocument();
    expect(within(body).getByRole("link", { name: /Tour shirt/ })).toHaveAttribute(
      "href",
      "https://store.example.com/shirt",
    );
  });

  it("renders only hero and outro when all widgets are disabled", async () => {
    getMerchItemsMock.mockResolvedValue([createMerch({})]);
    const { container } = await renderJourney(
      withWidgets({ nextShow: false, release: false, merch: false }),
    );

    expect(stops(container)).toEqual(["hero", "outro"]);
    expect(screen.getByTestId("guitar-stage")).toHaveAttribute("data-route", "hero,outro");
    expect(getShowsMock).not.toHaveBeenCalled();
    expect(getMerchItemsMock).not.toHaveBeenCalled();
  });

  it("renders the release title and CTA href from settings.release", async () => {
    const settings = getDefaultSettings();
    settings.release = {
      title: "Brand new single",
      description: "Out now everywhere.",
      href: "https://example.com/listen",
    };
    const { container } = await renderJourney(settings);

    const release = container.querySelector<HTMLElement>('[data-stop="release"]') as HTMLElement;
    expect(within(release).getByRole("heading", { name: "Brand new single" })).toBeInTheDocument();
    expect(within(release).getByText("Out now everywhere.")).toBeInTheDocument();
    expect(
      within(release).getByRole("link", { name: new RegExp(labels.home.latestReleaseCta) }),
    ).toHaveAttribute("href", "https://example.com/listen");
    expect(release.querySelector("iframe")).toBeNull();
  });

  it("loads a release iframe only after the visitor requests it", async () => {
    const { container } = await renderJourney();
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Load Spotify player" }));
    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      getDefaultSettings().release.embedUrl,
    );
  });

  it("outro contains links to /shows and /merch", async () => {
    const { container } = await renderJourney();

    const outro = container.querySelector<HTMLElement>('[data-stop="outro"]') as HTMLElement;
    const hrefs = within(outro)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining(["/shows", "/merch"]));
  });

  it("keeps the live signal across a remount", async () => {
    // Navigating away and back unmounts the page (and its JourneyStage) under
    // the layout's single provider; playback must survive that.
    let signal: PlaybackSignal | null = null;
    function Probe() {
      const current = usePlayback();
      useEffect(() => {
        signal = current;
      }, [current]);
      return null;
    }
    const page = await HomeJourney({ labels, locale: "en", settings: getDefaultSettings() });
    const tree = (content: React.ReactNode) => (
      <PlaybackProvider createDriver={simulated}>
        <Probe />
        {content}
      </PlaybackProvider>
    );
    const { rerender } = render(tree(page));
    fireEvent.click(screen.getByRole("button", { name: labels.home.journey.play }));

    rerender(tree(null));
    expect(screen.queryByTestId("guitar-stage")).toBeNull();
    rerender(tree(page));

    expect(screen.getByTestId("guitar-stage")).toBeInTheDocument();
    expect((signal as PlaybackSignal | null)?.playing).toBe(true);
    expect(screen.getByRole("button", { name: labels.home.journey.pause })).toBeInTheDocument();
  });
});
