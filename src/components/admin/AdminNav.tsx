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
    { href: "/admin/system", label: "System" },
  ] as const;

  return (
    <div className="punk-panel p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">Admin</p>
          <h1 className="mt-2 font-brand text-3xl uppercase tracking-[0.08em] text-text">
            Control Room
          </h1>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => signOut({ callbackUrl: "/admin" }))}
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
                  className={`inline-flex min-h-11 min-w-max items-center border-l-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                    isActive
                      ? "border-highlight bg-highlight/10 text-highlight"
                      : "border-border bg-bg/40 text-text-muted hover:border-highlight hover:text-text"
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
