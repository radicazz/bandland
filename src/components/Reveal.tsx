"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades and lifts its content in once it first scrolls into view. The hidden
 * state is CSS-only and applies once hydrated code adds `reveal-ready` to the
 * root (IntroSeen), so content stays visible without JavaScript or if the
 * bundle fails to load.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  as?: "div" | "li";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reveal = () => node.setAttribute("data-revealed", "");
    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-reveal="" className={className}>
      {children}
    </Tag>
  );
}
