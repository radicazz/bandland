import Link from "next/link";

import { readAudit, readMerch, readShows } from "@/lib/content-store";

function formatAuditDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

const actions = [
  { href: "/admin/shows/new", label: "Add a show", hint: "Publish a new live date" },
  { href: "/admin/merch/new", label: "Add merch", hint: "Create a store listing" },
  { href: "/admin/shows", label: "Manage shows", hint: "Edit dates and tickets" },
  { href: "/admin/merch", label: "Manage merch", hint: "Edit products and links" },
] as const;

export default async function AdminDashboardPage() {
  const [shows, merch, audit] = await Promise.all([
    readShows(),
    readMerch(),
    readAudit().catch(() => []),
  ]);

  return (
    <div className="grid gap-6 sm:gap-8">
      <section>
        <p className="section-kicker">Quick actions</p>
        <h2 className="display-title mt-6 text-4xl sm:text-5xl">What are we doing?</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {actions.map((action, index) => (
            <Link
              key={action.href}
              href={action.href}
              className="group border-l-2 border-border bg-bg/60 p-4 transition-colors hover:border-highlight hover:bg-highlight/5 sm:p-5"
            >
              <span className="font-mono text-[10px] text-text-dim">0{index + 1}</span>
              <span className="mt-3 block text-base font-semibold text-text group-hover:text-highlight">
                {action.label}
              </span>
              <span className="mt-1 block text-sm text-text-muted">{action.hint}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Shows", count: shows.length, href: "/admin/shows" },
          { label: "Merch", count: merch.length, href: "/admin/merch" },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="punk-panel p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-text-dim">
              {item.label}
            </p>
            <p className="mt-3 font-mono text-4xl tabular-nums text-highlight">{item.count}</p>
          </Link>
        ))}
      </section>

      <section className="punk-panel p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-text">Recent changes</h2>
          <Link href="/admin/system" className="text-xs uppercase tracking-[0.2em] text-highlight">
            System status
          </Link>
        </div>
        {audit.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">No changes recorded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 border-t border-border/60">
            {audit.slice(0, 5).map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between"
              >
                <p className="text-sm text-text">
                  <span className="capitalize">{entry.action}</span> {entry.entity}
                </p>
                <p className="font-mono text-xs tabular-nums text-text-dim">
                  {formatAuditDate(entry.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
