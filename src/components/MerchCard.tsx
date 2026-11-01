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
    <article className="card-interactive punk-panel flex h-full min-w-0 flex-col p-4 sm:p-6">
      {item.imageUrl ? (
        <div className="relative mb-5 aspect-square overflow-hidden border border-border bg-bg/50">
          {badgeLabel ? (
            <span
              className={`absolute left-0 top-0 z-10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] ${
                item.badge === "new"
                  ? "bg-highlight text-bg"
                  : "border-b border-r border-border bg-bg text-text"
              }`}
            >
              {badgeLabel}
            </span>
          ) : null}
          <ContentImage
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-contain p-3"
            fallbackClassName="flex h-full w-full items-center justify-center bg-surface/50"
            fallbackLabel={item.name}
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 384px"
          />
        </div>
      ) : null}
      <h2 className="break-words font-brand text-xl uppercase tracking-[0.08em] text-text">
        {item.name}
      </h2>
      {badgeLabel && !item.imageUrl ? (
        <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-highlight">
          {badgeLabel}
        </p>
      ) : null}
      <p className="mt-2 break-words font-mono text-sm tabular-nums text-highlight">{item.price}</p>
      {item.description ? (
        <p className="mt-3 break-words text-sm leading-6 text-text-muted">{item.description}</p>
      ) : null}
      <div className="mt-auto pt-5">
        <a
          className="btn-primary w-full"
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${labels.view}: ${item.name} (${newTabLabel})`}
        >
          {labels.view}
          <span aria-hidden className="ml-2">
            ↗
          </span>
        </a>
      </div>
    </article>
  );
}
