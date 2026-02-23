import { Container } from "@/components/Container";
import { site } from "@/config/site";

type SiteFooterProps = {
  tagline: string;
};

export function SiteFooter({ tagline }: SiteFooterProps) {
  return (
    <footer className="border-t border-border/40 bg-bg/50">
      <Container className="flex flex-col gap-2 py-4 text-sm text-text-dim sm:flex-row sm:items-center sm:justify-between sm:py-5">
        <p className="break-words">© {new Date().getFullYear()} {site.name}</p>
        <p className="max-w-xl text-sm text-text-muted">{tagline}</p>
      </Container>
    </footer>
  );
}
