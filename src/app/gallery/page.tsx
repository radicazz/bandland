import { Container } from "@/components/Container";
import { site } from "@/config/site";

export const metadata = {
  title: "Gallery",
};

export default function GalleryPage() {
  const instagramUrl =
    site.socials.find((social) => social.label === "Instagram")?.href ??
    "https://www.instagram.com/";

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-16 h-[320px] w-[320px] rounded-full bg-highlight/15 blur-3xl" />
        <div className="absolute inset-0 bg-surface/35" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>

      <Container className="relative py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Gallery</p>
        <h1 className="mt-4 text-4xl font-brand uppercase tracking-[0.22em] text-highlight sm:text-5xl">
          Instagram
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">
          Latest posts and behind-the-scenes moments. Instagram embeds landing soon.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {["01", "02", "03"].map((label) => (
            <div
              key={label}
              className="flex aspect-square items-center justify-center rounded-2xl border border-border/70 bg-surface/60 text-xs uppercase tracking-[0.4em] text-text-dim"
            >
              {label}
            </div>
          ))}
        </div>

        <a
          className="mt-8 inline-flex min-h-10 items-center justify-center rounded-full border border-highlight/60 bg-highlight/10 px-5 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-highlight transition-colors hover:bg-highlight/20 whitespace-normal"
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
        >
          Follow on Instagram
        </a>
      </Container>
    </section>
  );
}
