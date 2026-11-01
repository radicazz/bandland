import { ContentImage } from "@/components/ContentImage";
import type { Locale, Translations } from "@/i18n/translations";
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
}: ShowCardProps) {
  const calendar = !isPast && !previewOnly ? buildShowCalendar(show) : null;
  const hasSplitPrices = Boolean(show.priceOnline || show.priceDoor);
  const formattedDate = formatShowDatePretty(show.date, locale);
  const dateBlock = getShowDateBlock(show.date, locale);

  return (
    <article
      className={`rounded-2xl border p-5 sm:p-6 ${
        isNext ? "border-highlight/70 bg-surface-2" : "border-border bg-surface"
      }`}
    >
      <div className="flex gap-4 sm:gap-6">
        {dateBlock ? (
          <div
            aria-hidden="true"
            className={`flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-xl border text-center sm:h-24 sm:w-20 ${
              isPast ? "border-border text-text-muted" : "border-border bg-bg text-text"
            }`}
          >
            <span className="text-sm font-semibold uppercase leading-none text-highlight">
              {dateBlock.month}
            </span>
            <span className="mt-1 text-3xl font-bold tabular-nums leading-none sm:text-4xl">
              {dateBlock.day}
            </span>
            <span className="mt-1 text-xs tabular-nums leading-none text-text-dim">
              {dateBlock.year}
            </span>
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {isNext ? (
            <p className="mb-1 text-sm font-semibold text-highlight">{labels.nextShowBadge}</p>
          ) : null}
          {isPast ? (
            <p className="mb-1 text-sm font-semibold text-text-dim">{labels.pastShow}</p>
          ) : null}
          <p className="break-words text-xl font-bold leading-snug text-text">{show.venue}</p>
          <p className="break-words text-base text-text-muted">{show.city}</p>
          <p className="mt-2 break-words text-base tabular-nums text-text">{formattedDate}</p>
          {show.timeFrame ? (
            <p className="mt-1 break-words text-base text-text-muted">
              {labels.timeFrameLabel}: <span className="text-text">{show.timeFrame}</span>
            </p>
          ) : null}
          {hasSplitPrices ? (
            <div className="mt-3 grid gap-1.5 text-base">
              {show.priceOnline ? (
                <p className="inline-flex items-start gap-2 break-words text-text">
                  <span className="mt-1 text-highlight" aria-hidden="true">
                    <OnlinePriceIcon />
                  </span>
                  <span>
                    <span className="text-text-muted">{labels.onlinePriceLabel}:</span>{" "}
                    <span className="tabular-nums">{show.priceOnline}</span>
                  </span>
                </p>
              ) : null}
              {show.priceDoor ? (
                <p className="inline-flex items-start gap-2 break-words text-text">
                  <span className="mt-1 text-highlight" aria-hidden="true">
                    <DoorPriceIcon />
                  </span>
                  <span>
                    <span className="text-text-muted">{labels.doorPriceLabel}:</span>{" "}
                    <span className="tabular-nums">{show.priceDoor}</span>
                  </span>
                </p>
              ) : null}
            </div>
          ) : show.price ? (
            <p className="mt-3 break-words text-base tabular-nums text-text">{show.price}</p>
          ) : null}
        </div>
      </div>

      {show.imageUrl ? (
        <div className="mx-auto mt-5 aspect-[2/3] w-full max-w-64 overflow-hidden rounded-xl border border-border bg-bg sm:mx-0">
          <ContentImage
            src={show.imageUrl}
            alt={`${show.venue} show poster`}
            className="h-full w-full object-contain"
            fallbackClassName="flex h-full w-full items-center justify-center bg-surface"
            fallbackLabel={show.venue}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      {show.ticketUrl || calendar ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {show.ticketUrl ? (
            previewOnly ? (
              <span
                className="btn-primary pointer-events-none w-full sm:w-auto"
                aria-label={`${labels.tickets} preview`}
              >
                {labels.tickets}
              </span>
            ) : (
              <a
                className="btn-primary w-full sm:w-auto"
                href={show.ticketUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`${labels.tickets}: ${show.venue} (${newTabLabel})`}
              >
                {labels.tickets}
                <span aria-hidden>↗</span>
              </a>
            )
          ) : null}
          {calendar ? (
            <a
              className="btn-secondary w-full sm:w-auto"
              href={calendar.href}
              download={calendar.filename}
              aria-label={`${labels.addToCalendar}: ${show.venue}`}
            >
              {labels.addToCalendar}
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
