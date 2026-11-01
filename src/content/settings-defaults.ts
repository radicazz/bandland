import { site } from "@/config/site";
import {
  SOCIAL_PLATFORMS,
  WIDGET_IDS,
  type SiteSettings,
  type WidgetSetting,
} from "@/content/schema";

const DEFAULT_WIDTHS: Record<WidgetSetting["id"], WidgetSetting["width"]> = {
  nextShow: "half",
  release: "half",
  merch: "full",
};

function defaultSocials(): SiteSettings["socials"] {
  const socials: SiteSettings["socials"] = [];
  for (const social of site.socials as readonly { label: string; href: string | null }[]) {
    const label = SOCIAL_PLATFORMS.find((platform) => platform === social.label);
    if (label && social.href) socials.push({ label, href: social.href });
  }
  return socials;
}

export function getDefaultSettings(): SiteSettings {
  return {
    hero: {},
    widgets: WIDGET_IDS.map((id) => ({ id, enabled: true, width: DEFAULT_WIDTHS[id] })),
    release: {
      title: site.latestRelease.title,
      href: site.latestRelease.href,
      embedUrl: site.latestRelease.spotifyEmbedUrl,
    },
    footer: { contactEmail: site.contactEmail },
    socials: defaultSocials(),
  };
}

/** Guarantees every widget exists exactly once, keeping the stored order. */
export function normalizeWidgets(widgets: WidgetSetting[]): WidgetSetting[] {
  const defaults = getDefaultSettings().widgets;
  const seen = new Set<string>();
  const ordered: WidgetSetting[] = [];
  for (const widget of widgets) {
    if (!seen.has(widget.id)) {
      seen.add(widget.id);
      ordered.push(widget);
    }
  }
  for (const widget of defaults) {
    if (!seen.has(widget.id)) ordered.push(widget);
  }
  return ordered;
}
