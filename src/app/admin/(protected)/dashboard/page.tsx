import { readAudit } from "@/lib/content-store";
import {
  getSiteOperationsSummary,
  type PathStatus,
} from "@/lib/site-operations";

function formatAuditDate(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(parsed);
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${
        ok
          ? "border-highlight/30 bg-highlight/10 text-highlight"
          : "border-border/70 bg-bg/50 text-text-dim"
      }`}
    >
      {label}
    </span>
  );
}

function PathStateRow({
  label,
  pathStatus,
}: {
  label: string;
  pathStatus: PathStatus | null;
}) {
  const isReady = Boolean(pathStatus?.exists && pathStatus.readable && pathStatus.writable);

  return (
    <div className="rounded-xl border border-border/60 bg-bg/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-text">{label}</p>
        <StatusBadge ok={isReady} label={isReady ? "Ready" : "Needs attention"} />
      </div>
      <p className="mt-3 break-all text-xs text-text-muted">
        {pathStatus?.path ?? "Not configured"}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-text-dim">
        {pathStatus
          ? `exists ${pathStatus.exists ? "yes" : "no"} · read ${pathStatus.readable ? "yes" : "no"} · write ${pathStatus.writable ? "yes" : "no"}`
          : "uses app fallback"}
      </p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [summary, audit] = await Promise.all([
    getSiteOperationsSummary(),
    readAudit().catch(() => []),
  ]);
  const recent = audit.slice(0, 5);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 md:grid-cols-2">
        {[
          {
            label: "Shows",
            value: summary.content.shows.count ?? 0,
            hint: "Upcoming + past",
          },
          {
            label: "Merch",
            value: summary.content.merch.count ?? 0,
            hint: "Active items",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border/70 bg-surface/70 p-4 sm:p-6"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-text tabular-nums">{card.value}</p>
            <p className="mt-2 text-sm text-text-muted">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/70 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text">Site operations</h2>
            <p className="mt-1 text-sm text-text-muted">
              Production storage, runtime, and deployment-relevant checks.
            </p>
          </div>
          <StatusBadge
            ok={summary.content.allValid}
            label={summary.content.allValid ? "Healthy" : "Degraded"}
          />
        </div>

        {summary.warnings.length > 0 ? (
          <ul className="mt-4 grid gap-3">
            {summary.warnings.map((warning) => (
              <li
                key={warning.id}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  warning.severity === "error"
                    ? "border-highlight/40 bg-highlight/10 text-highlight"
                    : "border-border/60 bg-bg/60 text-text-muted"
                }`}
              >
                {warning.message}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-bg/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">Storage</p>
            <p className="mt-3 text-xl font-semibold text-text">
              {summary.storage.mode === "external" ? "External content" : "Repo-local content"}
            </p>
            <p className="mt-2 break-all text-sm text-text-muted">
              {summary.storage.contentRoot}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-text-dim">
              Latest backup
            </p>
            <p className="mt-1 text-sm tabular-nums text-text">
              {summary.activity.latestBackupAt ?? "No backups yet"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-bg/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">Runtime</p>
            <p className="mt-3 text-xl font-semibold text-text">
              {summary.environment.nodeEnv}
            </p>
            <p className="mt-2 text-sm text-text-muted">
              Port {summary.environment.appPort}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-text-dim">
              Health check
            </p>
            <p className="mt-1 break-all text-sm text-text">
              {summary.environment.deployHealthcheckUrl}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-bg/50 p-4">
            <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">Activity</p>
            <p className="mt-3 text-xl font-semibold text-text">
              {summary.activity.latestAuditAt ? "Recent changes tracked" : "No audit entries"}
            </p>
            <p className="mt-2 text-sm tabular-nums text-text-muted">
              {summary.activity.latestAuditAt ?? "No recorded admin changes yet"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge
                ok={summary.environment.authUrlConfigured}
                label={summary.environment.authUrlConfigured ? "AUTH_URL set" : "AUTH_URL missing"}
              />
              <StatusBadge
                ok={summary.environment.publicSiteUrlConfigured}
                label={
                  summary.environment.publicSiteUrlConfigured
                    ? "Site URL set"
                    : "Site URL missing"
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <PathStateRow label="Content storage" pathStatus={summary.paths.contentRoot} />
          <PathStateRow label="Backup history" pathStatus={summary.paths.historyRoot} />
          <PathStateRow label="Rate-limit storage" pathStatus={summary.paths.rateLimitRoot} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {[summary.content.shows, summary.content.merch, summary.content.audit].map((item) => (
            <div key={item.key} className="rounded-xl border border-border/60 bg-bg/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium capitalize text-text">{item.key}</p>
                <StatusBadge ok={item.valid} label={item.valid ? "Valid" : "Invalid"} />
              </div>
              <p className="mt-3 break-all text-xs text-text-muted">{item.file.path}</p>
              <p className="mt-2 text-sm text-text">
                {item.count !== null ? `${item.count} entries` : "Unavailable"}
              </p>
              {item.error ? (
                <p className="mt-2 text-xs text-highlight">{item.error}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/70 p-4 sm:p-6">
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
                  <p className="mt-2 break-all text-sm text-text">{entry.entityId}</p>
                  <p className="mt-2 text-xs tabular-nums text-text-muted">
                    {formatAuditDate(entry.createdAt)}
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
