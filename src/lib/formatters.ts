import type { Locale } from "@/i18n/translations";

const SHOW_TIME_ZONE = "Africa/Johannesburg";

function getOrdinalSuffix(value: number) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) {
    return "th";
  }
  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatShowDatePretty(value: string, locale: Locale) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const timeParts = new Intl.DateTimeFormat(locale, {
    timeZone: SHOW_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(parsed);

  const dateParts = new Intl.DateTimeFormat(locale, {
    timeZone: SHOW_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(parsed);

  const hour = timeParts.find((part) => part.type === "hour")?.value ?? "";
  const minute = timeParts.find((part) => part.type === "minute")?.value ?? "";
  const dayPeriod =
    timeParts.find((part) => part.type === "dayPeriod")?.value.toLowerCase() ??
    "";

  const weekday = dateParts.find((part) => part.type === "weekday")?.value ?? "";
  const day = dateParts.find((part) => part.type === "day")?.value ?? "";
  const month = dateParts.find((part) => part.type === "month")?.value ?? "";

  const numericDay = Number.parseInt(day, 10);
  const ordinal = Number.isNaN(numericDay)
    ? day
    : `${numericDay}${getOrdinalSuffix(numericDay)}`;

  const time = minute === "00" ? `${hour}${dayPeriod}` : `${hour}:${minute}${dayPeriod}`;

  return `${time} - ${weekday} the ${ordinal} of ${month}`;
}
