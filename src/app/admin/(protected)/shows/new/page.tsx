import Link from "next/link";
import { redirect } from "next/navigation";

import { ShowForm } from "@/components/admin/ShowForm";
import { getTranslationsFromCookies } from "@/i18n/server";
import { createShowAction } from "@/lib/admin-actions";
import { getMediaUploadPrefix } from "@/lib/media-store";
import { isReadOnlyDeployment } from "@/lib/runtime-environment";

export default async function AdminShowNewPage() {
  if (isReadOnlyDeployment()) redirect("/admin/shows");
  const { labels, locale } = await getTranslationsFromCookies();
  return (
    <section className="rounded-2xl border border-border/70 bg-surface/70 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-text-dim">Shows</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Add new show</h2>
        </div>
        <Link href="/admin/shows" className="btn-primary w-full sm:w-auto">
          Back to shows
        </Link>
      </div>
      <ShowForm
        action={createShowAction}
        labels={labels.shows}
        locale={locale}
        submitLabel="Create show"
        uploadPrefix={getMediaUploadPrefix("shows")}
      />
    </section>
  );
}
