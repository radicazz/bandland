import { Container } from "@/components/Container";

export default function Loading() {
  return (
    <section>
      <Container className="flex min-h-[60svh] items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-highlight" />
          <p className="text-base text-text-muted">Loading...</p>
        </div>
      </Container>
    </section>
  );
}
