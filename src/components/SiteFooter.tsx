import { Container } from "@/components/Container";
import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="sticky bottom-0 z-30 border-t border-border/40 bg-bg/50 backdrop-blur-md">
      <Container className="flex h-auto flex-col items-start gap-2 py-4 text-sm text-text-dim sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <p>Built for fast shows + fast pages.</p>
      </Container>
    </footer>
  );
}
