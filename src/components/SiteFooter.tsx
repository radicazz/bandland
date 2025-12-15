import { Container } from "@/components/Container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-bg/70">
      <Container className="flex h-16 items-center justify-between text-sm text-text-dim">
        <p>© bandland</p>
        <p>Built for fast shows + fast pages.</p>
      </Container>
    </footer>
  );
}
