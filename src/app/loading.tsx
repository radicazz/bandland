import { Container } from "@/components/Container";

export default function Loading() {
  return (
    <section className="relative min-h-[100svh] -mt-16 overflow-hidden pt-16 sm:min-h-[calc(100svh-4rem)]">
      <div aria-hidden className="absolute inset-0 bg-surface/40">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-highlight/5 to-transparent" />
      </div>

      <Container className="relative flex min-h-[100svh] items-center justify-center py-16 sm:min-h-[calc(100svh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-highlight/20 border-t-highlight" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </Container>
    </section>
  );
}
