import { getSiteOperationsSummary } from "@/lib/site-operations";

function Status({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? "text-highlight" : "text-text-muted"}>
      {ok ? "Ready" : "Needs attention"}
    </span>
  );
}

export default async function AdminSystemPage() {
  const summary = await getSiteOperationsSummary();
  const rows = [
    ["Content", summary.paths.contentRoot],
    ["Backups", summary.paths.historyRoot],
    ["Login limits", summary.paths.rateLimitRoot],
    ["Media", summary.paths.mediaRoot],
    ["Media history", summary.paths.mediaHistoryRoot],
  ] as const;

  return (
    <section className="punk-panel p-4 sm:p-6">
      <p className="section-kicker">System</p>
      <h2 className="display-title mt-6 text-4xl sm:text-5xl">Site health</h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted">
        Storage and deployment checks. Routine content work belongs on the dashboard.
      </p>

      {summary.warnings.length ? (
        <ul className="mt-6 grid gap-2">
          {summary.warnings.map((warning) => (
            <li
              key={warning.id}
              className="border-l-2 border-highlight bg-highlight/5 p-3 text-sm text-text-muted"
            >
              {warning.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 border-l-2 border-highlight bg-highlight/5 p-3 text-sm text-text">
          All configured checks are healthy.
        </p>
      )}

      <dl className="mt-6 grid gap-3 lg:grid-cols-2">
        {rows.map(([label, state]) => {
          const ok = Boolean(state?.exists && state.readable && state.writable);
          return (
            <div key={label} className="border border-border bg-bg/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm font-semibold text-text">{label}</dt>
                <dd className="text-xs font-bold uppercase tracking-[0.18em]">
                  <Status ok={ok} />
                </dd>
              </div>
              <dd className="mt-3 break-all font-mono text-xs text-text-dim">
                {state?.path ?? "Not configured"}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
