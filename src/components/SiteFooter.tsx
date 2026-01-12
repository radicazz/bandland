import { Container } from "@/components/Container";
import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="sticky bottom-0 z-30 border-t border-border/40 bg-bg/50 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between text-sm text-text-dim">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <p>Built for fast shows + fast pages.</p>
      </Container>
    </footer>
  );
}
