import { describe, expect, it } from "vitest";

import { formatShowDatePretty } from "@/lib/formatters";

describe("formatShowDatePretty", () => {
  it("formats English dates without hard-coded ordinals", () => {
    expect(formatShowDatePretty("2026-03-15T20:00:00+02:00", "en")).toBe(
      "Sunday, 15 March 2026 at 20:00",
    );
  });

  it("formats Afrikaans dates without mixing in English words", () => {
    expect(formatShowDatePretty("2026-03-15T20:00:00+02:00", "af")).toBe(
      "Sondag 15 Maart 2026 om 20:00",
    );
  });
});
