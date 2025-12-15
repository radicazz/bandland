import { Container } from "@/components/Container";
import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-bg/70">
      <Container className="flex h-16 items-center justify-between text-sm text-text-dim">
        <p>© {new Date().getFullYear()} {site.name}</p>
        <p>Built for fast shows + fast pages.</p>
      </Container>
    </footer>
  );
}
