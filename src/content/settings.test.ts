import { describe, expect, it } from "vitest";

import { normalizeEmbedUrl, siteSettingsSchema } from "@/content/schema";
import { getDefaultSettings, normalizeWidgets } from "@/content/settings-defaults";

describe("site settings", () => {
  it("ships defaults that satisfy the schema", () => {
    expect(siteSettingsSchema.safeParse(getDefaultSettings()).success).toBe(true);
  });

  it("turns a plain Spotify link into an embed link", () => {
    expect(normalizeEmbedUrl("https://open.spotify.com/track/abc123?si=x")).toBe(
      "https://open.spotify.com/embed/track/abc123?si=x",
    );
    const parsed = siteSettingsSchema.parse({
      ...getDefaultSettings(),
      release: {
        title: "Song",
        href: "https://example.com/listen",
        embedUrl: "https://open.spotify.com/album/xyz",
      },
    });
    expect(parsed.release.embedUrl).toBe("https://open.spotify.com/embed/album/xyz");
  });

  it("rejects unsupported players, bad emails and duplicate widgets", () => {
    const base = getDefaultSettings();
    expect(
      siteSettingsSchema.safeParse({
        ...base,
        release: { ...base.release, embedUrl: "https://evil.example.com/embed/x" },
      }).success,
    ).toBe(false);
    expect(
      siteSettingsSchema.safeParse({ ...base, footer: { contactEmail: "nope" } }).success,
    ).toBe(false);
    expect(
      siteSettingsSchema.safeParse({
        ...base,
        widgets: [base.widgets[0], base.widgets[0]],
      }).success,
    ).toBe(false);
    expect(
      siteSettingsSchema.safeParse({
        ...base,
        socials: [{ label: "Instagram", href: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
  });

  it("keeps the stored order and appends any missing widgets", () => {
    const result = normalizeWidgets([{ id: "merch", enabled: false, width: "half" }]);
    expect(result.map((widget) => widget.id)).toEqual(["merch", "nextShow", "release"]);
    expect(result[0]?.enabled).toBe(false);
  });
});
