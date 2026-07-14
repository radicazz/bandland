import { Container } from "@/components/Container";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { HomeCarousel } from "@/components/HomeCarousel";
import { site } from "@/config/site";
import { slideshowImages } from "@/config/slideshow";
import { getTranslationsFromCookies } from "@/i18n/server";

export default async function Home() {
  const { labels, locale } = await getTranslationsFromCookies();

  return (
    <section className="relative -mt-16 overflow-hidden border-b border-border/60 pt-16">
      <HeroSlideshow slides={[...slideshowImages]} />

      <Container className="relative py-12 sm:py-16 lg:py-20">
        <div className="mb-12 max-w-4xl sm:mb-16 lg:mb-20">
          <p className="section-kicker">{labels.home.pinned}</p>
          <h1 className="display-title mt-6 text-[clamp(4.5rem,18vw,10rem)]">{site.name}</h1>
          <div className="mt-6 flex max-w-xl items-start gap-4 border-l-2 border-highlight pl-4 sm:mt-8">
            <p className="text-sm font-medium leading-6 text-text-muted sm:text-base">
              {labels.meta.description}
            </p>
          </div>
        </div>
        <HomeCarousel labels={labels} locale={locale} />
      </Container>
    </section>
  );
}
