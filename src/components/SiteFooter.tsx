import { Container } from "@/components/Container";
import { site } from "@/config/site";

type SiteFooterProps = {
  tagline: string;
};

export function SiteFooter({ tagline }: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-bg/90">
      <Container className="flex flex-col gap-3 py-6 text-sm text-text-dim sm:flex-row sm:items-center sm:justify-between">
        <p className="break-words font-mono text-xs uppercase tracking-[0.18em]">
          © {new Date().getFullYear()} {site.name}
        </p>
        <p className="max-w-xl border-l border-highlight pl-3 text-xs uppercase tracking-[0.12em] text-text-muted">
          {tagline}
        </p>
      </Container>
    </footer>
  );
}
