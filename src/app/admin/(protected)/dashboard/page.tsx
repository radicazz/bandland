import { readAudit, readMerch, readShows } from "@/lib/content-store";

export default async function AdminDashboardPage() {
  const [shows, merch, audit] = await Promise.all([
    readShows(),
    readMerch(),
    readAudit(),
  ]);
  const recent = audit.slice(0, 5);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Shows", value: shows.length, hint: "Upcoming + past" },
          { label: "Merch", value: merch.length, hint: "Active items" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border/70 bg-surface/70 p-6"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-text tabular-nums">{card.value}</p>
            <p className="mt-2 text-sm text-text-muted">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text">Recent activity</h2>
          <p className="text-xs uppercase tracking-[0.3em] text-text-dim">Audit log</p>
        </div>
        <div className="mt-4 border-t border-border/60 pt-4">
          {recent.length === 0 ? (
            <p className="text-sm text-text-muted">No changes yet.</p>
          ) : (
            <ul className="grid gap-4">
              {recent.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-border/60 bg-bg/60 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-text-dim">
                    {entry.action} {entry.entity}
                  </p>
                  <p className="mt-2 text-sm text-text">
                    {entry.entityId}
                  </p>
                  <p className="mt-2 text-xs tabular-nums text-text-muted">
                    {entry.createdAt}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
