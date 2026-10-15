import type { ReactNode } from "react";

import { Container } from "@/components/Container";

export function PageSection({ children }: { children: ReactNode }) {
  return (
    <section className="page-glow relative overflow-hidden border-b border-border/60">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-surface/40" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 hero-grain" />
      </div>
      <Container className="relative py-12 sm:py-16 lg:py-20">{children}</Container>
    </section>
  );
}

export function PageIntro({
  label,
  title,
  description,
}: {
  label?: string;
  title: string;
  description: string;
}) {
  return (
    <>
      {label ? <p className="section-kicker">{label}</p> : null}
      <h1
        className={`display-title break-words text-5xl sm:text-7xl lg:text-8xl ${label ? "mt-6" : ""}`}
      >
        {title}
      </h1>
      <p className="mt-4 max-w-2xl break-words text-sm leading-6 text-text-muted">{description}</p>
    </>
  );
}
