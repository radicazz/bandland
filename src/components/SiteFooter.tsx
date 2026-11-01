import { Container } from "@/components/Container";
import { SocialLinks } from "@/components/SocialLinks";
import { site } from "@/config/site";

type SiteFooterProps = {
  tagline: string;
  bookingLabel: string;
};

export function SiteFooter({ tagline, bookingLabel }: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-bg/90">
      <Container className="flex flex-col gap-5 py-8 text-sm text-text-dim sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <p className="break-words font-mono text-xs uppercase tracking-[0.18em]">
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="max-w-xl border-l border-highlight pl-3 text-xs uppercase tracking-[0.12em] text-text-muted">
            {tagline}
          </p>
          <a
            href={`mailto:${site.contactEmail}`}
            className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.18em] text-text underline decoration-highlight underline-offset-4 hover:text-highlight"
          >
            {bookingLabel}
          </a>
        </div>
        <SocialLinks className="sm:justify-end" />
      </Container>
    </footer>
  );
}
