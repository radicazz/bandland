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

export function getShowDateTimeFields(value: string): { date: string; time: string } {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "" };

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOW_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(parsed);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

export function combineShowDateTime(date: string, time: string): string {
  return `${date}T${time}:00+02:00`;
}

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
