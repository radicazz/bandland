import Link from "next/link";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { getLocaleFromCookies } from "@/i18n/server";
import { deleteShowAction } from "@/lib/admin-actions";
import { readShows } from "@/lib/content-store";
import { formatShowDatePretty } from "@/lib/formatters";

export default async function AdminShowsPage() {
  const shows = await readShows();
  const locale = await getLocaleFromCookies();
  const formatShowDate = (value: string) => formatShowDatePretty(value, locale);

  return (
    <section className="rounded-2xl border border-border/70 bg-surface/70 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">Shows</h2>
          <p className="mt-2 text-sm text-text-muted">
            Manage upcoming and past shows.
          </p>
        </div>
        <Link href="/admin/shows/new" className="btn-primary w-full sm:w-auto">
          New show
        </Link>
      </div>

      {shows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border/70 bg-bg/60 p-6 text-sm text-text-muted">
          No shows yet. Add the first one to get started.
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {shows.map((show) => (
            <li
              key={show.id}
              className="rounded-2xl border border-border/70 bg-bg/60 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                        show.hasHappened
                          ? "border-border/70 bg-surface/50 text-text-muted"
                          : "border-highlight/40 bg-highlight/10 text-highlight"
                      }`}
                    >
                      {show.hasHappened ? "Happened" : "Upcoming"}
                    </span>
                    <p className="break-words text-xs uppercase tracking-[0.3em] text-text-dim">
                      {formatShowDate(show.date)}
                    </p>
                  </div>
                  <p className="mt-2 break-words text-base font-semibold text-text">{show.venue}</p>
                  <p className="break-words text-sm text-text-muted">{show.city}</p>
                  {show.price ? (
                    <p className="mt-2 break-words text-sm tabular-nums text-text">
                      {show.price}
                    </p>
                  ) : null}
                </div>
                <div className="grid w-full gap-3 sm:w-auto sm:grid-flow-col sm:auto-cols-max sm:items-center">
                  <Link href={`/admin/shows/${show.id}`} className="btn-primary w-full sm:w-auto">
                    Edit
                  </Link>
                  <form action={deleteShowAction} className="w-full sm:w-auto">
                    <input type="hidden" name="id" value={show.id} />
                    <DeleteButton confirmMessage="Delete this show?" />
                  </form>
                </div>
              </div>
              {show.ticketUrl ? (
                <a
                  className="mt-4 inline-flex break-all text-xs uppercase tracking-[0.3em] text-highlight"
                  href={show.ticketUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ticket link
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
