import type { Metadata } from "next";

import { EmptyNotice, PageIntro, PageSection } from "@/components/PageSection";
import { MerchCard } from "@/components/MerchCard";
import { getMerchItems } from "@/content/merch";
import { getTranslationsFromCookies } from "@/i18n/server";

// Pinned to a wall, not laid in a grid: each card leans a little differently.
const MERCH_TILTS = ["left", "none", "right"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { labels } = await getTranslationsFromCookies();
  return {
    title: labels.merch.title,
  };
}

export default async function MerchPage() {
  const { labels } = await getTranslationsFromCookies();
  const merchItems = await getMerchItems();
  return (
    <PageSection>
      <PageIntro
        title={labels.merch.title}
        description={labels.merch.introPrefix + labels.merch.introSuffix}
        photo="/photos/03-drummer-wide.webp"
      />
      {merchItems.length === 0 ? (
        <EmptyNotice message={labels.merch.empty} photo="/photos/01-guitar-bass-wide.webp" />
      ) : (
        <ul className="mt-14 grid items-start gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {merchItems.map((item, index) => (
            <li key={item.id} className="min-w-0">
              <MerchCard
                item={item}
                labels={labels.merch}
                newTabLabel={labels.common.opensInNewTab}
                tilt={MERCH_TILTS[index % MERCH_TILTS.length] ?? "none"}
              />
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  );
}
