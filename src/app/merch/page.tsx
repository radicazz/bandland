import { Container } from "@/components/Container";
import { merchItems } from "@/content/merch";

export const metadata = {
  title: "Merch",
};

export default function MerchPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text">Merch</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
        Featured items and store links. Edit{" "}
        <span className="font-mono text-text">content/merch.json</span> to update.
      </p>

      {merchItems.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border/70 bg-surface/50 p-6 text-sm text-text-muted">
          Storefront coming soon.
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {merchItems.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/70 bg-surface/50 p-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-text">{item.name}</p>
                {item.price ? <p className="text-sm text-text-dim">{item.price}</p> : null}
              </div>
              <a
                className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-border bg-surface/40 px-5 text-sm font-semibold text-text transition-colors hover:bg-surface"
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
  );
}

