import { ContentImage } from "@/components/ContentImage";
import type { MerchItem } from "@/content/schema";
import type { Translations } from "@/i18n/translations";

export function MerchCard({
  item,
  labels,
  newTabLabel = "opens in a new tab",
}: {
  item: MerchItem;
  labels: Translations["merch"];
  newTabLabel?: string;
}) {
  const badgeLabel =
    item.badge === "new" ? labels.badgeNew : item.badge === "sold-out" ? labels.badgeSoldOut : null;
  return (
    <article className="card-interactive panel flex h-full min-w-0 flex-col overflow-hidden">
      {item.imageUrl ? (
        <div className="relative aspect-square overflow-hidden border-b border-border bg-bg">
          {badgeLabel ? (
            <span
              className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-sm font-semibold ${
                item.badge === "new" ? "bg-highlight text-bg" : "bg-text text-bg"
              }`}
            >
              {badgeLabel}
            </span>
          ) : null}
          <ContentImage
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-contain p-4"
            fallbackClassName="flex h-full w-full items-center justify-center bg-surface"
            fallbackLabel={item.name}
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 384px"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {badgeLabel && !item.imageUrl ? (
          <p className="mb-2 text-sm font-semibold text-highlight">{badgeLabel}</p>
        ) : null}
        <h2 className="break-words text-xl font-bold leading-snug text-text">{item.name}</h2>
        <p className="mt-1 break-words text-lg font-semibold tabular-nums text-highlight">
          {item.price}
        </p>
        {item.description ? (
          <p className="mt-3 break-words text-base leading-7 text-text-muted">{item.description}</p>
        ) : null}
        <div className="mt-auto pt-6">
          <a
            className="btn-primary w-full"
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${labels.view}: ${item.name} (${newTabLabel})`}
          >
            {labels.view}
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}
