import { ContentImage } from "@/components/ContentImage";
import type { Locale, Translations } from "@/i18n/translations";
import { formatShowDatePretty } from "@/lib/formatters";

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
  previewOnly?: boolean;
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
  previewOnly = false,
}: ShowCardProps) {
  const hasSplitPrices = Boolean(show.priceOnline || show.priceDoor);
  const formattedDate = formatShowDatePretty(show.date, locale);

  return (
    <article
      className={`border-l-2 bg-surface/70 p-4 transition-colors sm:p-6 ${
        isPast
          ? "border-border/50 opacity-60 hover:border-border hover:opacity-80"
          : "border-border hover:border-highlight"
      }`}
    >
      <div
        className={`grid gap-4 md:items-start ${
          show.imageUrl ? "md:grid-cols-[160px_minmax(0,1fr)]" : ""
        }`}
      >
        {show.imageUrl ? (
          <div className="mx-auto aspect-[2/3] w-full max-w-64 overflow-hidden border border-border bg-bg/50 md:mx-0 md:max-w-none">
            <ContentImage
              src={show.imageUrl}
              alt={`${show.venue} show poster`}
              className="h-full w-full object-contain"
              fallbackClassName="flex h-full w-full items-center justify-center bg-surface/50"
              fallbackLabel={show.venue}
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-text">{show.venue}</p>
              <p className="break-words text-sm text-text-muted">{show.city}</p>
            </div>
            <p className="break-words text-sm tabular-nums text-text-dim sm:text-right">
              {formattedDate}
            </p>
          </div>
          {show.timeFrame ? (
            <p className="mt-2 break-words text-sm text-text-muted">
              {labels.timeFrameLabel}: <span className="text-text">{show.timeFrame}</span>
            </p>
          ) : null}
          {hasSplitPrices ? (
            <div className="mt-2 grid gap-2 text-sm">
              {show.priceOnline ? (
                <p className="inline-flex items-start gap-2 break-words text-text">
                  <span className="mt-0.5 text-highlight" aria-hidden="true">
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
                  <span className="mt-0.5 text-highlight" aria-hidden="true">
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
            <p className="mt-2 break-words text-sm tabular-nums text-text">{show.price}</p>
          ) : null}
          {show.ticketUrl ? (
            previewOnly ? (
              <span
                className="btn-primary pointer-events-none mt-4 w-full sm:w-auto"
                aria-label={`${labels.tickets} preview`}
              >
                {labels.tickets}
              </span>
            ) : (
              <a
                className="btn-primary mt-4 w-full sm:w-auto"
                href={show.ticketUrl}
                target="_blank"
                rel="noreferrer"
              >
                {labels.tickets}
              </a>
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}
