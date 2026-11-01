import type { ReactNode } from "react";

import { Container } from "@/components/Container";

export function PageSection({ children }: { children: ReactNode }) {
  return (
    <section className="border-b border-border">
      <Container className="py-12 sm:py-16 lg:py-20">{children}</Container>
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
    <header className="max-w-3xl">
      {label ? <p className="section-kicker">{label}</p> : null}
      <h1 className={`display-title text-5xl sm:text-6xl lg:text-7xl ${label ? "mt-3" : ""}`}>
        {title}
      </h1>
      <p className="mt-5 max-w-2xl break-words text-lg leading-8 text-text-muted">{description}</p>
    </header>
  );
}
