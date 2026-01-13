import type { Metadata } from "next";
import { Geist, Geist_Mono, Grenze_Gotisch } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
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
  const { labels } = await getTranslationsFromCookies();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: site.name,
      template: `%s · ${site.name}`,
    },
    description: labels.meta.description,
    openGraph: {
      title: site.name,
      description: labels.meta.description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description: labels.meta.description,
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
