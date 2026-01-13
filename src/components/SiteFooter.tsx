import { Container } from "@/components/Container";
export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-bg/50">
      <Container className="flex h-auto flex-col items-start gap-2 py-4 text-sm text-text-dim sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <p>© {new Date().getFullYear()} Insites Global</p>
        <p>Skollie Afrikaans band</p>
      </Container>
    </footer>
  );
}
