import Link from "next/link";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteMerchAction } from "@/lib/admin-actions";
import { readMerch } from "@/lib/content-store";

export default async function AdminMerchPage() {
  const items = await readMerch();

  return (
    <section className="rounded-2xl border border-border/70 bg-surface/70 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">Merch</h2>
          <p className="mt-2 text-sm text-text-muted">
            Manage merch items and store links.
          </p>
        </div>
        <Link href="/admin/merch/new" className="btn-primary w-full sm:w-auto">
          New merch
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border/70 bg-bg/60 p-6 text-sm text-text-muted">
          No merch items yet. Add the first one to get started.
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/70 bg-bg/60 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-base font-semibold text-text">{item.name}</p>
                  {item.description ? (
                    <p className="mt-2 break-words text-sm text-text-muted">{item.description}</p>
                  ) : null}
                  <p className="mt-2 break-words text-sm tabular-nums text-text">{item.price}</p>
                </div>
                <div className="grid w-full gap-3 sm:w-auto sm:grid-flow-col sm:auto-cols-max sm:items-center">
                  <Link href={`/admin/merch/${item.id}`} className="btn-primary w-full sm:w-auto">
                    Edit
                  </Link>
                  <form action={deleteMerchAction} className="w-full sm:w-auto">
                    <input type="hidden" name="id" value={item.id} />
                    <DeleteButton confirmMessage="Delete this merch item?" />
                  </form>
                </div>
              </div>
              <a
                className="mt-4 inline-flex break-all text-xs uppercase tracking-[0.3em] text-highlight"
                href={item.href}
                target="_blank"
                rel="noreferrer"
              >
                Store link
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
