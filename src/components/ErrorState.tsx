"use client";

import { useEffect } from "react";
import Link from "next/link";

import { PageIntro, PageSection } from "@/components/PageSection";
import { useErrorMessages } from "@/components/ErrorMessagesProvider";

export type ErrorStateProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function ErrorState({
  error,
  reset,
  scope = "general",
}: ErrorStateProps & { scope?: "general" | "shows" | "merch" }) {
  const labels = useErrorMessages();
  useEffect(() => {
    console.error(`[${scope}] Page error:`, error);
  }, [error, scope]);

  return (
    <PageSection>
      <PageIntro title={labels[scope].title} description={labels[scope].description} />
      <div className="mt-10 flex flex-wrap gap-4">
        <button onClick={reset} className="btn-primary" type="button">
          {labels.retry}
        </button>
        <Link href="/" className="btn-secondary">
          {labels.home}
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-6 break-words font-mono text-xs text-text-dim">
          {labels.reference}: {error.digest}
        </p>
      ) : null}
    </PageSection>
  );
}
