import type { Show } from "@/content/schema";

export function getShowTimestamp(show: Pick<Show, "date">): number | null {
  const parsed = Date.parse(show.date);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getResolvedHasHappened(show: Pick<Show, "date" | "hasHappened">, now = Date.now()) {
  if (show.hasHappened) {
    return true;
  }

  const time = getShowTimestamp(show);
  return time !== null && time < now;
}

export function getUpcomingShow(shows: Show[], now = Date.now()) {
  return [...shows]
    .filter((show) => {
      const time = getShowTimestamp(show);
      return time !== null && time >= now && !getResolvedHasHappened(show, now);
    })
    .sort((a, b) => {
      const aTime = getShowTimestamp(a) ?? Number.POSITIVE_INFINITY;
      const bTime = getShowTimestamp(b) ?? Number.POSITIVE_INFINITY;
      return aTime - bTime;
    })[0];
}

export function splitShowsByStatus(shows: Show[], now = Date.now()) {
  const upcoming: Show[] = [];
  const past: Show[] = [];

  for (const show of shows) {
    if (getResolvedHasHappened(show, now)) {
      past.push(show);
    } else {
      upcoming.push(show);
    }
  }

  upcoming.sort((a, b) => {
    const aTime = getShowTimestamp(a) ?? Number.POSITIVE_INFINITY;
    const bTime = getShowTimestamp(b) ?? Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  past.sort((a, b) => {
    const aTime = getShowTimestamp(a) ?? Number.NEGATIVE_INFINITY;
    const bTime = getShowTimestamp(b) ?? Number.NEGATIVE_INFINITY;
    return bTime - aTime;
  });

  return { upcoming, past };
}
