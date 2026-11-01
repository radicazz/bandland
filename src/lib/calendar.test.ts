import { describe, expect, it } from "vitest";

import { buildShowCalendar } from "./calendar";

describe("buildShowCalendar", () => {
  it("builds a 3 hour UTC event for a valid date", () => {
    const result = buildShowCalendar({
      date: "2027-07-24T20:30:00+02:00",
      venue: "Mercury, Live",
      city: "Cape Town",
    });
    const ics = decodeURIComponent(result?.href.split(",").slice(1).join(",") ?? "");
    expect(result?.filename).toBe("schmat-2027-07-24.ics");
    expect(ics).toContain("DTSTART:20270724T183000Z");
    expect(ics).toContain("DTEND:20270724T213000Z");
    expect(ics).toContain("LOCATION:Mercury\\, Live\\, Cape Town");
  });

  it("returns null for an invalid date", () => {
    expect(buildShowCalendar({ date: "nope", venue: "A", city: "B" })).toBeNull();
  });
});
