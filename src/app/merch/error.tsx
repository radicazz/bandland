"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Merch page error:", error);
  }, [error]);

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-highlight/20 blur-3xl" />
        <div className="absolute inset-0 bg-surface/40" />
      </div>

      <Container className="relative py-16 sm:py-20">
        <h1 className="mt-4 text-4xl font-brand uppercase tracking-[0.22em] text-highlight sm:text-5xl">
          Error loading merch
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">
          We could not load the merchandise. Please try again.
        </p>

        <div className="mt-10 flex gap-4">
          <button
            onClick={reset}
            className="btn-primary btn-primary-lg"
            type="button"
          >
            Try again
          </button>
          <Link href="/" className="btn-primary btn-primary-lg">
            Go home
          </Link>
        </div>
      </Container>
    </section>
  );
}
