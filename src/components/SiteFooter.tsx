import Link from "next/link";

import { Container } from "@/components/Container";
import { SocialLinks, type SocialLink } from "@/components/SocialLinks";
import { site } from "@/config/site";

type SiteFooterProps = {
  tagline: string;
  bookingLabel: string;
  newTabLabel?: string;
  contactEmail?: string;
  socials?: readonly SocialLink[];
};

/** Ink panel torn off the page above. The bottom padding clears the fixed player bar. */
export function SiteFooter({
  tagline,
  bookingLabel,
  newTabLabel = "opens in a new tab",
  contactEmail = site.contactEmail,
  socials,
}: SiteFooterProps) {
  return (
    <footer className="panel-ink torn-top paper-grain mt-8 pb-[var(--player-clear,0px)]">
      <Container className="grid gap-10 pt-16 pb-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-12">
        <div className="min-w-0">
          <p className="font-brand text-5xl leading-none text-text">{site.name}</p>
          <p className="mt-4 max-w-md text-lg font-semibold leading-snug text-text-muted">
            {tagline}
          </p>
          <p className="kicker mt-8">{bookingLabel}</p>
          <a
            href={`mailto:${contactEmail}`}
            aria-label={`${bookingLabel}: ${contactEmail}`}
            className="mt-2 inline-flex min-h-11 items-center break-all text-xl font-extrabold tracking-tight text-text underline decoration-2 underline-offset-[6px] hover:decoration-[3px]"
          >
            {contactEmail}
          </a>
        </div>
        <div className="flex min-w-0 flex-col gap-8 md:items-end">
          <SocialLinks
            className="md:justify-end"
            newTabLabel={newTabLabel}
            {...(socials ? { socials } : {})}
          />
          <p className="flex flex-wrap items-center gap-x-5 text-sm font-semibold text-text-dim md:justify-end">
            <span className="tabular-nums">
              © {new Date().getFullYear()} {site.name}
            </span>
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-text"
            >
              Admin
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
