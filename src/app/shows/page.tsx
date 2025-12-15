import { Container } from "@/components/Container";
import { shows } from "@/content/shows";

export const metadata = {
  title: "Shows",
};

export default function ShowsPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text">Shows</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
        Live dates and ticket links. Edit{" "}
        <span className="font-mono text-text">content/shows.json</span> to update.
      </p>

      {shows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border/70 bg-surface/50 p-6 text-sm text-text-muted">
          No dates announced yet.
        </div>
      ) : (
        <ul className="mt-10 grid gap-4">
          {shows.map((show) => (
            <li key={show.id} className="rounded-2xl border border-border/70 bg-surface/50 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{show.venue}</p>
                  <p className="text-sm text-text-muted">{show.city}</p>
                </div>
                <p className="text-sm text-text-dim">{show.date}</p>
              </div>
              {show.ticketUrl ? (
                <a
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-text px-5 text-sm font-semibold text-bg transition-colors hover:bg-highlight"
                  href={show.ticketUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Tickets
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
