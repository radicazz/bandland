import { unstable_cache } from "next/cache";

import type { SiteSettings } from "@/content/schema";
import { getDefaultSettings, normalizeWidgets } from "@/content/settings-defaults";
import { readSettings } from "@/lib/content-store";

const getCachedSettings = unstable_cache(async () => readSettings(), ["settings-data"], {
  revalidate: 3600,
  tags: ["settings"],
});

/**
 * Site-wide settings. The layout depends on this, so a storage failure falls back
 * to the built-in defaults instead of taking the whole site down.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await getCachedSettings();
    return { ...settings, widgets: normalizeWidgets(settings.widgets) };
  } catch (error) {
    console.error("[Settings] Falling back to default settings", error);
    return getDefaultSettings();
  }
}
