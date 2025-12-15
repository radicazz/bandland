import { Container } from "@/components/Container";
import { site } from "@/config/site";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-highlight/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(230,226,218,0.10),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(242,242,242,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(242,242,242,0.18)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <Container className="relative py-20 sm:py-28">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-text-dim">
          Under construction
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-text sm:text-6xl">
          {site.name}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted">
          {site.description}
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="#music"
            className="inline-flex h-11 items-center justify-center rounded-full bg-text px-6 text-sm font-semibold text-bg transition-colors hover:bg-highlight"
          >
            Listen
          </a>
          <a
            href="#contact"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface/40 px-6 text-sm font-semibold text-text transition-colors hover:bg-surface"
          >
            Get updates
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-dim">
          {site.socials
            .filter((s) => s.href)
            .map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="transition-colors hover:text-text"
                target="_blank"
                rel="noreferrer"
              >
                {s.label}
              </a>
            ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <section
            id="music"
            className="scroll-mt-24 rounded-2xl border border-border/70 bg-surface/50 p-6"
          >
            <h2 className="text-base font-semibold text-text">Music</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Streaming links and releases coming soon.
            </p>
          </section>

          <section
            id="shows"
            className="scroll-mt-24 rounded-2xl border border-border/70 bg-surface/50 p-6"
          >
            <h2 className="text-base font-semibold text-text">Shows</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Tour dates will appear here with ticket links.
            </p>
          </section>

          <section
            id="merch"
            className="scroll-mt-24 rounded-2xl border border-border/70 bg-surface/50 p-6"
          >
            <h2 className="text-base font-semibold text-text">Merch</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Storefront and featured items coming soon.
            </p>
          </section>
        </div>

        <section
          id="contact"
          className="mt-6 scroll-mt-24 rounded-2xl border border-border/70 bg-surface-2/40 p-6"
        >
          <h2 className="text-base font-semibold text-text">Contact</h2>
          {site.contactEmail ? (
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Booking / press:{" "}
              <a className="text-text underline underline-offset-4" href={`mailto:${site.contactEmail}`}>
                {site.contactEmail}
              </a>
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Add your contact email in <span className="font-mono text-text">src/config/site.ts</span>.
            </p>
          )}
        </section>
      </Container>
    </div>
  );
}
