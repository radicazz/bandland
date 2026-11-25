import { ContentImage } from "@/components/ContentImage";
import { fitWords, Slanted } from "@/components/Slanted";
import type { Locale, Translations } from "@/i18n/translations";
import { isHttpsUrl } from "@/lib/public-url";
import { buildShowCalendar } from "@/lib/calendar";
import { formatShowDatePretty, getShowDateBlock } from "@/lib/formatters";

export type ShowCardDetails = {
  date: string;
  venue: string;
  city: string;
  timeFrame?: string | undefined;
  price?: string | undefined;
  priceOnline?: string | undefined;
  priceDoor?: string | undefined;
  ticketUrl?: string | undefined;
  imageUrl?: string | undefined;
};

type ShowCardProps = {
  show: ShowCardDetails;
  locale: Locale;
  labels: Translations["shows"];
  isPast?: boolean;
  isNext?: boolean;
  previewOnly?: boolean;
  newTabLabel?: string;
  /** Heading level for the venue; lists under an h2 pass "h3". */
  venueAs?: "p" | "h3";
};

export function OnlinePriceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4a12 12 0 0 1 0 16" />
      <path d="M12 4a12 12 0 0 0 0 16" />
    </svg>
  );
}

export function DoorPriceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M7 4.5h8a1 1 0 0 1 1 1v13H8a1 1 0 0 1-1-1z" />
      <path d="M10.5 12.5h.01" strokeLinecap="round" />
      <path d="M16 18.5h1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ShowCard({
  show,
  locale,
  labels,
  isPast = false,
  isNext = false,
  previewOnly = false,
  newTabLabel = "opens in a new tab",
  venueAs: Venue = "p",
}: ShowCardProps) {
  const ticketUrl = !isPast && isHttpsUrl(show.ticketUrl) ? show.ticketUrl : undefined;
  const calendar = !isPast && !previewOnly ? buildShowCalendar(show) : null;
  const hasSplitPrices = Boolean(show.priceOnline || show.priceDoor);
  const formattedDate = formatShowDatePretty(show.date, locale);
  const dateBlock = getShowDateBlock(show.date, locale);

  // Ticket stub: date on the left behind a perforated edge, details on the right.
  const tone = isNext
    ? "panel-ink paper-grain"
    : isPast
      ? "panel-paper border-2 border-dashed border-border"
      : "panel-paper border-2 border-text shadow-[6px_6px_0_0_var(--text)]";

  return (
    <article className={`relative ${tone}`}>
      <div className="flex">
        {dateBlock ? (
          <div
            aria-hidden="true"
            className={`flex w-20 shrink-0 flex-col items-center justify-start border-r-2 border-dashed px-2 py-6 text-center sm:w-28 sm:justify-center ${
              isPast ? "border-border text-text-dim" : "border-current text-text"
            }`}
          >
            <span className="kicker text-current">{dateBlock.month}</span>
            <span className="mt-2 text-5xl font-extrabold leading-none tracking-tight tabular-nums sm:text-6xl">
              {dateBlock.day}
            </span>
            <span className="mt-2 text-sm font-bold leading-none tabular-nums">
              {dateBlock.year}
            </span>
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 [container-type:inline-size] md:flex-1">
            {isNext ? (
              <p className="mb-3 inline-block -rotate-2 bg-red px-2 py-1 text-sm font-bold text-paper">
                {labels.nextShowBadge}
              </p>
            ) : null}
            {isPast ? <p className="kicker mb-2 text-text-dim">{labels.pastShow}</p> : null}
            <Venue
              className={`headline break-words ${
                isNext
                  ? "headline-italic fit-words [--fit-max:2.25rem] sm:[--fit-max:3rem]"
                  : isPast
                    ? "text-2xl text-text-dim line-through decoration-2 sm:text-3xl"
                    : "text-3xl sm:text-4xl"
              }`}
              style={isNext ? fitWords(show.venue) : undefined}
            >
              {isNext ? <Slanted text={show.venue} /> : show.venue}
            </Venue>
            <p
              className={`mt-2 break-words text-lg font-bold ${isPast ? "text-text-dim" : "text-text"}`}
            >
              {show.city}
            </p>
            <p className="mt-1 break-words text-base font-medium tabular-nums text-text-muted">
              {formattedDate}
            </p>
            {show.timeFrame ? (
              <p className="mt-1 break-words text-base text-text-muted">
                {labels.timeFrameLabel}:{" "}
                <span className="font-semibold text-text tabular-nums">{show.timeFrame}</span>
              </p>
            ) : null}
            {hasSplitPrices ? (
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-base">
                {show.priceOnline ? (
                  <p className="inline-flex items-center gap-2 break-words text-text">
                    <span className="text-text-muted" aria-hidden="true">
                      <OnlinePriceIcon />
                    </span>
                    <span>
                      <span className="text-text-muted">{labels.onlinePriceLabel}:</span>{" "}
                      <span className="font-bold tabular-nums">{show.priceOnline}</span>
                    </span>
                  </p>
                ) : null}
                {show.priceDoor ? (
                  <p className="inline-flex items-center gap-2 break-words text-text">
                    <span className="text-text-muted" aria-hidden="true">
                      <DoorPriceIcon />
                    </span>
                    <span>
                      <span className="text-text-muted">{labels.doorPriceLabel}:</span>{" "}
                      <span className="font-bold tabular-nums">{show.priceDoor}</span>
                    </span>
                  </p>
                ) : null}
              </div>
            ) : show.price ? (
              <p className="mt-3 break-words text-base font-bold tabular-nums text-text">
                {show.price}
              </p>
            ) : null}
            {ticketUrl || calendar ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {ticketUrl ? (
                  previewOnly ? (
                    <span
                      className="btn-zine-red pointer-events-none"
                      aria-label={`${labels.tickets} preview`}
                    >
                      {labels.tickets}
                      <span aria-hidden>{"\u25B6\uFE0E"}</span>
                    </span>
                  ) : (
                    <a
                      className="btn-zine-red"
                      href={ticketUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${labels.tickets}: ${show.venue} (${newTabLabel})`}
                    >
                      {labels.tickets}
                      <span aria-hidden>{"\u25B6\uFE0E"}</span>
                    </a>
                  )
                ) : null}
                {calendar ? (
                  <a
                    className="btn-zine"
                    href={calendar.href}
                    download={calendar.filename}
                    aria-label={`${labels.addToCalendar}: ${show.venue}`}
                  >
                    {labels.addToCalendar}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
          {show.imageUrl ? (
            <div
              className={`photo-frame w-40 shrink-0 self-center sm:w-44 md:self-start ${
                isPast ? "tilt-none" : "tilt-right"
              }`}
            >
              <div className="panel-paper aspect-[2/3] overflow-hidden">
                <ContentImage
                  src={show.imageUrl}
                  alt={`${show.venue} show poster`}
                  className="h-full w-full object-contain"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-paper-2"
                  fallbackLabel={show.venue}
                  sizes="176px"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
