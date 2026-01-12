import { Container } from "@/components/Container";
import { merchItems } from "@/content/merch";

export const metadata = {
  title: "Merch",
};

export default function MerchPage() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-8 h-[320px] w-[320px] rounded-full bg-highlight/15 blur-3xl" />
        <div className="absolute inset-0 bg-surface/35" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>

      <Container className="relative py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Store</p>
        <h1 className="mt-4 text-4xl font-[var(--font-brand)] uppercase tracking-[0.22em] text-highlight sm:text-5xl">
          Merch
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">
          Featured items and store links. Edit{" "}
          <span className="font-mono text-text">content/merch.json</span> to update.
        </p>

        {merchItems.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border/70 bg-surface/60 p-6 text-sm text-text-muted">
            Storefront coming soon.
          </div>
        ) : (
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {merchItems.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-border/70 bg-surface/60 p-6 transition-colors hover:border-highlight/60"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-text">{item.name}</p>
                  {item.price ? (
                    <p className="text-sm tabular-nums text-text-dim">{item.price}</p>
                  ) : null}
                </div>
                <a
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-highlight/60 bg-highlight/10 px-5 text-xs font-semibold uppercase tracking-[0.3em] text-highlight transition-colors hover:bg-highlight/20"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
