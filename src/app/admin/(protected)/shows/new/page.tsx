import Link from "next/link";

import { ShowForm } from "@/components/admin/ShowForm";
import { createShowAction } from "@/lib/admin-actions";

export default function AdminShowNewPage() {
  return (
    <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Shows</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Add new show</h2>
        </div>
        <Link href="/admin/shows" className="btn-primary">
          Back to shows
        </Link>
      </div>
      <ShowForm action={createShowAction} submitLabel="Create show" />
    </section>
  );
}
