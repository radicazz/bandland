import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MerchForm } from "@/components/admin/MerchForm";
import { updateMerchAction } from "@/lib/admin-actions";
import { readMerch } from "@/lib/content-store";
import { getMediaUploadPrefix } from "@/lib/media-store";
import { isReadOnlyDeployment } from "@/lib/runtime-environment";

type AdminMerchEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMerchEditPage({ params }: AdminMerchEditPageProps) {
  if (isReadOnlyDeployment()) redirect("/admin/merch");
  const { id } = await params;
  const items = await readMerch();
  const item = items.find((entry) => entry.id === id);

  if (!item) {
    notFound();
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-surface/70 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Merch</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Edit merch</h2>
        </div>
        <Link href="/admin/merch" className="btn-primary w-full sm:w-auto">
          Back to merch
        </Link>
      </div>
      <MerchForm
        action={updateMerchAction}
        submitLabel="Save changes"
        initialValues={item}
        uploadPrefix={getMediaUploadPrefix("merch")}
      />
    </section>
  );
}
