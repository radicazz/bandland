import { HomeJourney } from "@/components/home/HomeJourney";
import { getSiteSettings } from "@/content/settings";
import { getTranslationsFromCookies } from "@/i18n/server";

export default async function Home() {
  const { labels, locale } = await getTranslationsFromCookies();
  const settings = await getSiteSettings();

  return <HomeJourney labels={labels} locale={locale} settings={settings} />;
}
