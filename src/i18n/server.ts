import "server-only";
import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  defaultLocale,
  isLocale,
  translations,
  type Locale,
  type Translations,
} from "@/i18n/translations";

export async function getLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getTranslationsFromCookies(): Promise<{
  locale: Locale;
  labels: Translations;
}> {
  const locale = await getLocaleFromCookies();
  return { locale, labels: translations[locale] };
}
