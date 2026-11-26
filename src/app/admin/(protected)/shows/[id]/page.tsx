import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ShowForm } from "@/components/admin/ShowForm";
import { getTranslationsFromCookies } from "@/i18n/server";
import { updateShowAction } from "@/lib/admin-actions";
import { readShows } from "@/lib/content-store";
import { getMediaUploadPrefix } from "@/lib/media-store";
import { isReadOnlyDeployment } from "@/lib/runtime-environment";

type AdminShowEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminShowEditPage({ params }: AdminShowEditPageProps) {
  if (isReadOnlyDeployment()) redirect("/admin/shows");
  const { id } = await params;
  const [shows, { labels, locale }] = await Promise.all([
    readShows(),
    getTranslationsFromCookies(),
  ]);
  const show = shows.find((item) => item.id === id);

  if (!show) {
    notFound();
  }

  return (
    <section className="panel p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="kicker">Shows</p>
          <h2 className="headline mt-3 text-3xl">Edit show</h2>
        </div>
        <Link href="/admin/shows" className="btn-zine w-full sm:w-auto">
          Back to shows
        </Link>
      </div>
      <ShowForm
        action={updateShowAction}
        labels={labels.shows}
        locale={locale}
        submitLabel="Save changes"
        initialValues={show}
        uploadPrefix={getMediaUploadPrefix("shows")}
      />
    </section>
  );
}
