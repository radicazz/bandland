import type { Locale } from "@/i18n/translations";

const SHOW_TIME_ZONE = "Africa/Johannesburg";
const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-ZA",
  af: "af-ZA",
};

const CONNECTORS: Record<Locale, string> = {
  en: "at",
  af: "om",
};

export function formatShowDatePretty(value: string, locale: Locale) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const localeTag = LOCALE_TAGS[locale];
  const dateLabel = new Intl.DateTimeFormat(localeTag, {
    timeZone: SHOW_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
  const timeLabel = new Intl.DateTimeFormat(localeTag, {
    timeZone: SHOW_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);

  return `${dateLabel} ${CONNECTORS[locale]} ${timeLabel}`;
}
