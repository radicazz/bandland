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

export function getPublicUrl(pathname: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(pathname, baseUrl).toString();
}
