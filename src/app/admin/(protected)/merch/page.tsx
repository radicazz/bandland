import Link from "next/link";

import { ContentImage } from "@/components/ContentImage";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteMerchAction } from "@/lib/admin-actions";
import { readMerch } from "@/lib/content-store";
import { isReadOnlyDeployment } from "@/lib/runtime-environment";

export default async function AdminMerchPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const items = await readMerch();
  const readOnly = isReadOnlyDeployment();

  return (
    <section className="punk-panel p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text">Merch</h2>
          <p className="mt-2 text-sm text-text-muted">Manage merch items and store links.</p>
        </div>
        {!readOnly ? (
          <Link href="/admin/merch/new" className="btn-primary w-full sm:w-auto">
            New merch
          </Link>
        ) : null}
      </div>
      <AdminNotice value={saved} entity="Merch item" />

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border/70 bg-bg/60 p-6 text-sm text-text-muted">
          No merch items yet. Add the first one to get started.
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {items.map((item) => (
            <li key={item.id} className="border border-border bg-bg/60 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-start">
                <div className="overflow-hidden border border-border bg-surface/50">
                  <ContentImage
                    src={item.imageUrl}
                    alt=""
                    className="h-28 w-full object-cover sm:h-24"
                    fallbackClassName="flex h-28 w-full items-center justify-center bg-surface/50 sm:h-24"
                    fallbackLabel="No photo"
                  />
                </div>
                <div className="min-w-0">
                  <p className="break-words text-base font-semibold text-text">{item.name}</p>
                  {item.description ? (
                    <p className="mt-2 break-words text-sm text-text-muted">{item.description}</p>
                  ) : null}
                  <p className="mt-2 break-words text-sm tabular-nums text-text">{item.price}</p>
                </div>
                {!readOnly ? (
                  <div className="grid w-full gap-2 sm:w-auto sm:items-center">
                    <Link href={`/admin/merch/${item.id}`} className="btn-primary w-full sm:w-auto">
                      Edit
                    </Link>
                    <form action={deleteMerchAction} className="w-full sm:w-auto">
                      <input type="hidden" name="id" value={item.id} />
                      <DeleteButton confirmMessage="Delete this merch item?" />
                    </form>
                  </div>
                ) : null}
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
