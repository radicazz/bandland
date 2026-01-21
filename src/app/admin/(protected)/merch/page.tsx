import Link from "next/link";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteMerchAction } from "@/lib/admin-actions";
import { readMerch } from "@/lib/content-store";

export default async function AdminMerchPage() {
  const items = await readMerch();

  return (
    <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">Merch</h2>
          <p className="mt-2 text-sm text-text-muted">
            Manage merch items and store links.
          </p>
        </div>
        <Link href="/admin/merch/new" className="btn-primary">
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
              className="rounded-2xl border border-border/70 bg-bg/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-text">{item.name}</p>
                  {item.description ? (
                    <p className="mt-2 text-sm text-text-muted">{item.description}</p>
                  ) : null}
                  <p className="mt-2 text-sm tabular-nums text-text">{item.price}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/admin/merch/${item.id}`} className="btn-primary">
                    Edit
                  </Link>
                  <form action={deleteMerchAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <DeleteButton confirmMessage="Delete this merch item?" />
                  </form>
                </div>
              </div>
              <a
                className="mt-4 inline-flex text-xs uppercase tracking-[0.3em] text-highlight"
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
