const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

function toIcsDate(ms: number) {
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/[,;]/g, (m) => `\\${m}`)
    .replace(/\r?\n/g, "\\n");
}

export function buildShowCalendar(show: { date: string; venue: string; city: string }) {
  const start = Date.parse(show.date);
  if (Number.isNaN(start)) return null;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Schmat//Shows//EN",
    "BEGIN:VEVENT",
    `UID:${toIcsDate(start)}-${encodeURIComponent(show.venue)}@schmat`,
    `DTSTAMP:${toIcsDate(Date.now())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(start + DEFAULT_DURATION_MS)}`,
    `SUMMARY:${escapeIcs(`Schmät @ ${show.venue}`)}`,
    `LOCATION:${escapeIcs(`${show.venue}, ${show.city}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return {
    href: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`,
    filename: `schmat-${new Date(start).toISOString().slice(0, 10)}.ics`,
  };
}
