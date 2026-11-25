import { HomeZine } from "@/components/home/HomeZine";
import { getSiteSettings } from "@/content/settings";
import { getTranslationsFromCookies } from "@/i18n/server";

export default async function Home() {
  const { labels, locale } = await getTranslationsFromCookies();
  const settings = await getSiteSettings();

  return <HomeZine labels={labels} locale={locale} settings={settings} />;
}
