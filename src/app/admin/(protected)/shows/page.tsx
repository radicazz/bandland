import Link from "next/link";

import { ContentImage } from "@/components/ContentImage";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { getLocaleFromCookies } from "@/i18n/server";
import { deleteShowAction } from "@/lib/admin-actions";
import { readShows } from "@/lib/content-store";
import { formatShowDatePretty } from "@/lib/formatters";
import { getResolvedHasHappened, splitShowsByStatus } from "@/lib/shows";
import { isReadOnlyDeployment } from "@/lib/runtime-environment";

export default async function AdminShowsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const shows = await readShows();
  const { upcoming, past } = splitShowsByStatus(shows);
  const orderedShows = [...upcoming, ...past];
  const locale = await getLocaleFromCookies();
  const readOnly = isReadOnlyDeployment();
  const formatShowDate = (value: string) => formatShowDatePretty(value, locale);

  return (
    <section className="panel p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="headline text-3xl">Shows</h2>
          <p className="mt-2 text-sm text-text-muted">Manage upcoming and past shows.</p>
        </div>
        {!readOnly ? (
          <Link href="/admin/shows/new" className="btn-zine-red w-full sm:w-auto">
            New show
          </Link>
        ) : null}
      </div>
      <AdminNotice value={saved} entity="Show" />

      {shows.length === 0 ? (
        <div className="mt-6 border-2 border-dashed border-text p-6 text-sm text-text-muted">
          No shows yet. Add the first one to get started.
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {orderedShows.map((show) => {
            const hasSplitPrice = Boolean(show.priceOnline || show.priceDoor);
            const hasHappened = getResolvedHasHappened(show);

            return (
              <li key={show.id} className="border-2 border-text bg-bg p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-start">
                  <div className="overflow-hidden border-2 border-border bg-surface">
                    <ContentImage
                      src={show.imageUrl}
                      alt=""
                      className="h-28 w-full object-cover sm:h-24"
                      fallbackClassName="flex h-28 w-full items-center justify-center bg-surface sm:h-24"
                      fallbackLabel="No photo"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex min-h-7 items-center border-2 px-2.5 text-sm font-bold ${
                          hasHappened
                            ? "border-dashed border-text-dim text-text-muted"
                            : "border-highlight bg-highlight text-bg"
                        }`}
                      >
                        {hasHappened ? "Happened" : "Upcoming"}
                      </span>
                      <p className="break-words text-xs text-text-dim">
                        {formatShowDate(show.date)}
                      </p>
                    </div>
                    <p className="mt-2 break-words text-base font-semibold text-text">
                      {show.venue}
                    </p>
                    <p className="break-words text-sm text-text-muted">{show.city}</p>
                    {show.timeFrame ? (
                      <p className="mt-2 break-words text-sm text-text-muted">
                        Time frame: <span className="text-text">{show.timeFrame}</span>
                      </p>
                    ) : null}
                    {hasSplitPrice ? (
                      <div className="mt-2 grid gap-1 text-sm text-text">
                        {show.priceOnline ? (
                          <p className="break-words">
                            <span className="text-text-muted">Online:</span>{" "}
                            <span className="tabular-nums">{show.priceOnline}</span>
                          </p>
                        ) : null}
                        {show.priceDoor ? (
                          <p className="break-words">
                            <span className="text-text-muted">Door:</span>{" "}
                            <span className="tabular-nums">{show.priceDoor}</span>
                          </p>
                        ) : null}
                      </div>
                    ) : show.price ? (
                      <p className="mt-2 break-words text-sm tabular-nums text-text">
                        {show.price}
                      </p>
                    ) : null}
                  </div>
                  {!readOnly ? (
                    <div className="grid w-full gap-2 sm:w-auto sm:items-center">
                      <Link
                        href={`/admin/shows/${show.id}`}
                        className="btn-zine-red w-full sm:w-auto"
                      >
                        Edit
                      </Link>
                      <form action={deleteShowAction} className="w-full sm:w-auto">
                        <input type="hidden" name="id" value={show.id} />
                        <DeleteButton confirmMessage="Delete this show?" />
                      </form>
                    </div>
                  ) : null}
                </div>
                {show.ticketUrl ? (
                  <a
                    className="mt-4 inline-flex break-all text-xs font-bold text-highlight underline underline-offset-4"
                    href={show.ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ticket link
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
