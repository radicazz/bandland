import Link from "next/link";
import { redirect } from "next/navigation";

import { MerchForm } from "@/components/admin/MerchForm";
import { createMerchAction } from "@/lib/admin-actions";
import { getMediaUploadPrefix } from "@/lib/media-store";
import { isReadOnlyDeployment } from "@/lib/runtime-environment";

export default function AdminMerchNewPage() {
  if (isReadOnlyDeployment()) redirect("/admin/merch");
  return (
    <section className="panel p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="kicker">Merch</p>
          <h2 className="headline mt-3 text-3xl">Add new merch</h2>
        </div>
        <Link href="/admin/merch" className="btn-zine w-full sm:w-auto">
          Back to merch
        </Link>
      </div>
      <MerchForm
        action={createMerchAction}
        submitLabel="Create merch"
        uploadPrefix={getMediaUploadPrefix("merch")}
      />
    </section>
  );
}
