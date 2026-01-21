import Link from "next/link";
import { notFound } from "next/navigation";

import { ShowForm } from "@/components/admin/ShowForm";
import { updateShowAction } from "@/lib/admin-actions";
import { readShows } from "@/lib/content-store";

type AdminShowEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminShowEditPage({ params }: AdminShowEditPageProps) {
  const { id } = await params;
  const shows = await readShows();
  const show = shows.find((item) => item.id === id);

  if (!show) {
    notFound();
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Shows</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Edit show</h2>
        </div>
        <Link href="/admin/shows" className="btn-primary">
          Back to shows
        </Link>
      </div>
      <ShowForm action={updateShowAction} submitLabel="Save changes" initialValues={show} />
    </section>
  );
}
