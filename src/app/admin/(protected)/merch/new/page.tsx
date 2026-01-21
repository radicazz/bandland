import Link from "next/link";

import { MerchForm } from "@/components/admin/MerchForm";
import { createMerchAction } from "@/lib/admin-actions";

export default function AdminMerchNewPage() {
  return (
    <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Merch</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Add new merch</h2>
        </div>
        <Link href="/admin/merch" className="btn-primary">
          Back to merch
        </Link>
      </div>
      <MerchForm action={createMerchAction} submitLabel="Create merch" />
    </section>
  );
}
