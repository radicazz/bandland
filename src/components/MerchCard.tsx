import { ContentImage } from "@/components/ContentImage";
import { site } from "@/config/site";
import type { MerchItem } from "@/content/schema";
import { isHttpsUrl } from "@/lib/public-url";
import type { Translations } from "@/i18n/translations";

const TILTS = { left: "tilt-left", right: "tilt-right", none: "tilt-none" } as const;

/** Taped zine card: product photo, name, tabular price and a red store link. */
export function MerchCard({
  item,
  labels,
  titleAs: Title = "h2",
  newTabLabel = "opens in a new tab",
  tilt = "none",
}: {
  item: MerchItem;
  labels: Translations["merch"];
  titleAs?: "h2" | "h3";
  newTabLabel?: string;
  tilt?: keyof typeof TILTS;
}) {
  const badgeLabel =
    item.badge === "new" ? labels.badgeNew : item.badge === "sold-out" ? labels.badgeSoldOut : null;
  const badge = badgeLabel ? (
    <span
      className={`inline-block -rotate-3 px-2.5 py-1 text-sm font-bold ${
        item.badge === "new" ? "bg-red text-paper" : "bg-ink text-paper"
      }`}
    >
      {badgeLabel}
    </span>
  ) : null;

  return (
    <article className={`photo-frame panel-paper flex min-w-0 flex-col p-3 sm:p-4 ${TILTS[tilt]}`}>
      {item.imageUrl ? (
        <div className="relative aspect-square overflow-hidden bg-paper-2">
          {badge ? <div className="absolute left-2 top-2 z-10">{badge}</div> : null}
          <ContentImage
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-contain"
            fallbackClassName="flex h-full w-full items-center justify-center bg-paper-2"
            fallbackLabel={item.name}
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 384px"
          />
        </div>
      ) : (
        // No product photo: an ink slip with the wordmark keeps the wall even. The slip is decorative.
        <div className="relative">
          {badge ? <div className="absolute left-2 top-2 z-10">{badge}</div> : null}
          <div
            aria-hidden="true"
            className="panel-ink paper-grain flex aspect-square items-center justify-center overflow-hidden p-5"
          >
            <span className="wordmark text-7xl">{site.name}</span>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-start justify-between gap-4">
          <Title className="headline min-w-0 break-words text-2xl sm:text-3xl">{item.name}</Title>
          <p className="shrink-0 text-xl font-extrabold tracking-tight tabular-nums text-text">
            {item.price}
          </p>
        </div>
        {item.description ? (
          <p className="mt-3 break-words text-base leading-7 text-text-muted">{item.description}</p>
        ) : null}
        {isHttpsUrl(item.href) ? (
          <div className="mt-auto pt-5">
            <a
              className="btn-zine-red w-full"
              href={item.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${labels.view}: ${item.name} (${newTabLabel})`}
            >
              {labels.view}
              <span aria-hidden>{"↗︎"}</span>
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
