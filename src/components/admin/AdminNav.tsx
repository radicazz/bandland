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
    { href: "/admin/settings", label: "Settings" },
  ] as const;

  return (
    <div className="panel p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="kicker">Admin</p>
          <h1 className="headline mt-3 text-4xl">Control Room</h1>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => signOut({ callbackUrl: "/admin" }))}
          className="btn-zine-red w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
      <nav className="mt-5 sm:mt-6" aria-label="Admin sections">
        <ul className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center border-2 px-4 py-2 text-base font-bold transition-colors ${
                    isActive
                      ? "border-highlight bg-highlight text-bg"
                      : "border-text bg-bg text-text hover:bg-text hover:text-bg"
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
