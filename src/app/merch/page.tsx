import type { Metadata } from "next";

import { PageIntro, PageSection } from "@/components/PageSection";
import { MerchCard } from "@/components/MerchCard";
import { getMerchItems } from "@/content/merch";
import { getTranslationsFromCookies } from "@/i18n/server";

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
        label={labels.merch.label}
        title={labels.merch.title}
        description={labels.merch.introPrefix + labels.merch.introSuffix}
      />
      {merchItems.length === 0 ? (
        <div className="panel mt-10 p-6 text-base text-text-muted">{labels.merch.empty}</div>
      ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {merchItems.map((item) => (
            <li key={item.id} className="min-w-0">
              <MerchCard
                item={item}
                labels={labels.merch}
                newTabLabel={labels.common.opensInNewTab}
              />
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  );
}
