import { Container } from "@/components/Container";
import { SocialLinks } from "@/components/SocialLinks";
import { site } from "@/config/site";

type SiteFooterProps = {
  tagline: string;
  bookingLabel: string;
};

export function SiteFooter({ tagline, bookingLabel }: SiteFooterProps) {
  return (
    <footer className="bg-bg">
      <Container className="flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <p className="font-brand text-2xl text-text">{site.name}</p>
          <p className="mt-2 text-base text-text-muted">{tagline}</p>
          <a
            href={`mailto:${site.contactEmail}`}
            className="mt-4 inline-flex min-h-11 items-center text-base font-semibold text-text underline decoration-highlight decoration-2 underline-offset-4 hover:text-highlight"
          >
            {bookingLabel}
          </a>
        </div>
        <div className="flex flex-col gap-4 sm:items-end">
          <SocialLinks className="sm:justify-end" />
          <p className="text-sm text-text-dim">
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </Container>
    </footer>
  );
}
