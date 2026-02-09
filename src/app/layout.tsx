import type { Metadata } from "next";
import { Geist, Geist_Mono, Grenze_Gotisch } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { embed, getMetadataBase } from "@/config/embed";
import { site } from "@/config/site";
import { getTranslationsFromCookies } from "@/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
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
  return (
    <html lang={locale} className="bg-bg text-text">
      <head>
        <link rel="preconnect" href="https://open.spotify.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://open.spotify.com" />
        <link rel="preconnect" href="https://i.scdn.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i.scdn.co" />
        <link rel="preconnect" href="https://p.scdn.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://p.scdn.co" />
        <link rel="preconnect" href="https://embed.music.apple.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://embed.music.apple.com" />
        <link rel="preconnect" href="https://music.apple.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://music.apple.com" />
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
        <div className="flex min-h-dvh flex-col">
          <SiteHeader locale={locale} labels={labels} />
          <main id="content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
