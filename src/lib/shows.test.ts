import { describe, expect, it } from "vitest";

import type { Show } from "@/content/schema";
import {
  getResolvedHasHappened,
  getUpcomingShow,
  splitShowsByStatus,
} from "@/lib/shows";

const now = Date.parse("2026-03-20T12:00:00+02:00");

function createShow(overrides: Partial<Show>): Show {
  return {
    id: "70164137-f515-40b9-be69-d059f433bf21",
    date: "2026-03-15T20:00:00+02:00",
    hasHappened: false,
    venue: "The Waiting Room",
    city: "Cape Town, WC",
    createdAt: "2026-01-21T00:00:00Z",
    updatedAt: "2026-01-21T16:47:08.839Z",
    ...overrides,
  };
}

describe("getResolvedHasHappened", () => {
  it("treats past shows as happened even when the stored flag is false", () => {
    const show = createShow({ hasHappened: false });

    expect(getResolvedHasHappened(show, now)).toBe(true);
  });

  it("treats future shows as happened when manually archived", () => {
    const show = createShow({
      date: "2026-04-05T20:00:00+02:00",
      hasHappened: true,
    });

    expect(getResolvedHasHappened(show, now)).toBe(true);
  });
});

describe("getUpcomingShow", () => {
  it("skips manually archived future shows", () => {
    const archivedFuture = createShow({
      id: "2cc4b4ea-b69c-4ee7-a53c-8ad1c41f25dd",
      date: "2026-03-21T20:00:00+02:00",
      hasHappened: true,
      venue: "Archive Club",
    });
    const nextLiveShow = createShow({
      id: "9b952b5b-569b-4684-939f-37606bb5102c",
      date: "2026-03-22T20:00:00+02:00",
      hasHappened: false,
      venue: "Mercury Live",
    });

    expect(getUpcomingShow([archivedFuture, nextLiveShow], now)?.venue).toBe("Mercury Live");
  });
});

describe("splitShowsByStatus", () => {
  it("orders upcoming shows before past shows", () => {
    const shows = [
      createShow({
        id: "2cc4b4ea-b69c-4ee7-a53c-8ad1c41f25dd",
        date: "2026-03-10T20:00:00+02:00",
        venue: "Old Show",
      }),
      createShow({
        id: "9b952b5b-569b-4684-939f-37606bb5102c",
        date: "2026-03-25T20:00:00+02:00",
        venue: "Later Show",
      }),
      createShow({
        id: "7d259499-8bdc-4764-bbcf-c53e5b1c68a3",
        date: "2026-03-21T20:00:00+02:00",
        venue: "Next Show",
      }),
    ];

    const { upcoming, past } = splitShowsByStatus(shows, now);

    expect(upcoming.map((show) => show.venue)).toEqual(["Next Show", "Later Show"]);
    expect(past.map((show) => show.venue)).toEqual(["Old Show"]);
  });
});
