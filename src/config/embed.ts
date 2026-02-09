import { site } from "@/config/site";

export const embed = {
  og: {
    path: "/slideshow/01-hero.jpg",
    width: 1200,
    height: 630,
    alt: `${site.name} hero image`,
  },
  twitter: {
    path: "/slideshow/02-hero.jpg",
    width: 1200,
    height: 600,
    alt: `${site.name} hero image`,
  },
  logoPath: "/logos/schmat-rat.png",
} as const;

export function getSiteBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  return new URL(getSiteBaseUrl());
}

export function getPublicUrl(pathname: string): string {
  return new URL(pathname, getSiteBaseUrl()).toString();
}
