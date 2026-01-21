import Link from "next/link";

import { signOut } from "@/auth";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/admin" });
}

export function AdminNav() {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold text-text">Control Room</h1>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="btn-primary">
            Sign out
          </button>
        </form>
      </div>
      <nav className="mt-6">
        <ul className="flex flex-wrap gap-3">
          {[
            { href: "/admin/dashboard", label: "Dashboard" },
            { href: "/admin/shows", label: "Shows" },
            { href: "/admin/merch", label: "Merch" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-full border border-border/70 bg-bg/40 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-text-muted transition-colors hover:border-highlight/60 hover:text-text"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
