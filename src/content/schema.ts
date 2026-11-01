import { z } from "zod";

function deriveHasHappenedFromDate(date: string) {
  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) {
    return false;
  }
  return parsed < Date.now();
}

export const showInputSchema = z.object({
  date: z.string().datetime({ offset: true }),
  hasHappened: z.boolean(),
  timeFrame: z.string().min(1).optional(),
  venue: z.string().min(1),
  city: z.string().min(1),
  price: z.string().min(1).optional(),
  priceOnline: z.string().min(1).optional(),
  priceDoor: z.string().min(1).optional(),
  ticketUrl: z.string().url().optional(),
});

export const showSchema = showInputSchema
  .extend({
    id: z.string().uuid(),
    // Backward-compatible for older prod content files; missing values are auto-derived.
    hasHappened: showInputSchema.shape.hasHappened.optional(),
    imageUrl: z.string().url().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .transform((show) => ({
    ...show,
    hasHappened: show.hasHappened === true || deriveHasHappenedFromDate(show.date),
  }));

export type Show = z.infer<typeof showSchema>;

export const merchInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  price: z.string().min(1),
  href: z.string().url(),
  badge: z.enum(["new", "sold-out"]).optional(),
});

export const merchItemSchema = merchInputSchema.extend({
  id: z.string().uuid(),
  imageUrl: z.string().url().optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type MerchItem = z.infer<typeof merchItemSchema>;

export const adminAuditSchema = z.object({
  id: z.string().uuid(),
  actor: z.string().min(1),
  action: z.enum(["create", "update", "delete"]),
  entity: z.enum(["shows", "merch", "settings"]),
  entityId: z.string().uuid(),
  createdAt: z.string().datetime({ offset: true }),
  details: z.string().min(1).optional(),
});

export type AdminAuditEntry = z.infer<typeof adminAuditSchema>;

export const WIDGET_IDS = ["nextShow", "release", "merch"] as const;
export type WidgetId = (typeof WIDGET_IDS)[number];

export const WIDGET_WIDTHS = ["half", "full"] as const;
export type WidgetWidth = (typeof WIDGET_WIDTHS)[number];

export const SOCIAL_PLATFORMS = [
  "Instagram",
  "Spotify",
  "Apple Music",
  "TikTok",
  "YouTube",
  "Linktree",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const httpUrl = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), "Use a link starting with https://");

const optionalText = (max: number) => z.string().trim().max(max).optional();

const ALLOWED_EMBED_HOSTS = ["open.spotify.com", "embed.music.apple.com"];

/** Turns a plain Spotify share link into its embeddable form. */
export function normalizeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "open.spotify.com" && !url.pathname.startsWith("/embed")) {
      url.pathname = `/embed${url.pathname}`;
    }
    return url.toString();
  } catch {
    return value;
  }
}

const embedUrl = httpUrl.transform(normalizeEmbedUrl).refine((value) => {
  try {
    const url = new URL(value);
    return (
      ALLOWED_EMBED_HOSTS.includes(url.hostname) &&
      (url.hostname !== "open.spotify.com" || url.pathname.startsWith("/embed/"))
    );
  } catch {
    return false;
  }
}, "Use a Spotify or Apple Music link");

export const widgetSettingSchema = z.object({
  id: z.enum(WIDGET_IDS),
  enabled: z.boolean(),
  width: z.enum(WIDGET_WIDTHS),
});

export const siteSettingsSchema = z.object({
  hero: z.object({
    tagline: optionalText(160),
  }),
  widgets: z
    .array(widgetSettingSchema)
    .max(WIDGET_IDS.length)
    .refine(
      (widgets) => new Set(widgets.map((widget) => widget.id)).size === widgets.length,
      "Each widget can only appear once",
    ),
  release: z.object({
    title: z.string().trim().min(1, "Title is required").max(120),
    description: optionalText(280),
    href: httpUrl,
    embedUrl: embedUrl.optional(),
  }),
  footer: z.object({
    tagline: optionalText(160),
    contactEmail: z.string().trim().email("Enter a valid email address"),
  }),
  socials: z.array(z.object({ label: z.enum(SOCIAL_PLATFORMS), href: httpUrl })),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type WidgetSetting = z.infer<typeof widgetSettingSchema>;
