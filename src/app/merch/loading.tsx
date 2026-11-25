import { Container } from "@/components/Container";

export default function Loading() {
  return (
    <section>
      <Container className="flex min-h-[60svh] items-center justify-center py-16">
        <div role="status" className="flex flex-col items-center gap-4">
          <div
            aria-hidden="true"
            className="h-12 w-12 animate-spin rounded-full border-4 border-text border-t-highlight motion-reduce:animate-none"
          />
          <p className="kicker">Loading</p>
        </div>
      </Container>
    </section>
  );
}
