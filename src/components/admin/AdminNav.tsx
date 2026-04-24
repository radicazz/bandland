"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "next-auth/react";

export function AdminNav() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/shows", label: "Shows" },
    { href: "/admin/merch", label: "Merch" },
  ] as const;

  return (
    <div className="rounded-2xl border border-border/70 bg-surface/70 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold text-text">Control Room</h1>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => signOut({ callbackUrl: "/admin" }))
          }
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
      <nav className="mt-5 sm:mt-6" aria-label="Admin sections">
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-10 min-w-max items-center rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.22em] transition-colors ${
                    isActive
                      ? "border-highlight/50 bg-highlight/10 text-highlight"
                      : "border-border/70 bg-bg/40 text-text-muted hover:border-highlight/60 hover:text-text"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
