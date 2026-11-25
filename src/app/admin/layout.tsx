import type { ReactNode } from "react";

/*
 * Admin keeps the original dark monochrome theme. The `data-admin-theme` marker re-points
 * the design tokens (see globals.css), including on the root via `:has`.
 */
export default function AdminThemeLayout({ children }: { children: ReactNode }) {
  return (
    <div data-admin-theme="" className="bg-bg text-text">
      {children}
    </div>
  );
}
