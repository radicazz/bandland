import type { ReactNode } from "react";

/** Full-bleed layout (home page, site header): wide cap with the home page gutters. */
export const WIDE = "mx-auto w-full max-w-[100rem]";
export const GUTTER = "px-4 sm:px-8 lg:px-12";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className ?? ""}`}>{children}</div>
  );
}
