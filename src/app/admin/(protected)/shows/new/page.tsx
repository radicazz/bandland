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
    <section className="panel p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="kicker">Shows</p>
          <h2 className="headline mt-3 text-3xl">Add new show</h2>
        </div>
        <Link href="/admin/shows" className="btn-zine w-full sm:w-auto">
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
