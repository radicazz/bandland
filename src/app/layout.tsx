import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Grenze_Gotisch } from "next/font/google";
import "./globals.css";
import { BOOT_SCRIPT } from "./bootScript";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { IntroSeen } from "@/components/IntroSeen";
import { ErrorMessagesProvider } from "@/components/ErrorMessagesProvider";
import { PlaybackProvider } from "@/components/guitar/PlaybackProvider";
import { PlayerBar } from "@/components/player/PlayerBar";
import { embed, getMetadataBase } from "@/config/embed";
import { site } from "@/config/site";
import { getSiteSettings } from "@/content/settings";
import { getTranslationsFromCookies } from "@/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  preload: false,
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const bandlandGothic = Grenze_Gotisch({
  variable: "--font-bandland-gothic",
  subsets: ["latin"],
  weight: "700",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#060606",
};

export async function generateMetadata(): Promise<Metadata> {
  const { labels, locale } = await getTranslationsFromCookies();
  const description = labels.meta.description;
  const ogLocale = locale === "af" ? "af_ZA" : "en_US";

  return {
    metadataBase: getMetadataBase(),
    title: {
      default: "Schmät - Skollie Afrikaans Band",
      template: `%s · ${site.name}`,
    },
    description,
    openGraph: {
      title: site.name,
      description,
      type: "website",
      siteName: site.name,
      locale: ogLocale,
      url: "/",
      images: [
        {
          url: embed.og.path,
          width: embed.og.width,
          height: embed.og.height,
          alt: embed.og.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description,
      images: [embed.twitter.path],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, labels } = await getTranslationsFromCookies();
  const settings = await getSiteSettings();
  return (
    <html lang={locale} className="bg-bg text-text" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bandlandGothic.variable} antialiased`}
      >
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-text"
        >
          {labels.common.skipToContent}
        </a>
        <IntroSeen />
        {/* Playback lives here so the track keeps going across client navigation. */}
        <PlaybackProvider>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader locale={locale} labels={labels} socials={settings.socials} />
            <main id="content" tabIndex={-1} className="flex-1">
              <ErrorMessagesProvider labels={labels.errors}>{children}</ErrorMessagesProvider>
            </main>
            <SiteFooter
              tagline={settings.footer.tagline ?? labels.footer.tagline}
              bookingLabel={labels.footer.booking}
              newTabLabel={labels.common.opensInNewTab}
              contactEmail={settings.footer.contactEmail}
              socials={settings.socials}
            />
            <PlayerBar labels={labels.player} />
          </div>
        </PlaybackProvider>
      </body>
    </html>
  );
}
