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
    <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">Shows</h2>
          <p className="mt-2 text-sm text-text-muted">
            Manage upcoming and past shows.
          </p>
        </div>
        <Link href="/admin/shows/new" className="btn-primary">
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
              className="rounded-2xl border border-border/70 bg-bg/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-text-dim">
                    {formatShowDate(show.date)}
                  </p>
                  <p className="mt-2 text-base font-semibold text-text">{show.venue}</p>
                  <p className="text-sm text-text-muted">{show.city}</p>
                  {show.price ? (
                    <p className="mt-2 text-sm tabular-nums text-text">
                      {show.price}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/admin/shows/${show.id}`} className="btn-primary">
                    Edit
                  </Link>
                  <form action={deleteShowAction}>
                    <input type="hidden" name="id" value={show.id} />
                    <DeleteButton confirmMessage="Delete this show?" />
                  </form>
                </div>
              </div>
              {show.ticketUrl ? (
                <a
                  className="mt-4 inline-flex text-xs uppercase tracking-[0.3em] text-highlight"
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
