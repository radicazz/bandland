import type { SVGProps } from "react";

import { site } from "@/config/site";

export type IconProps = SVGProps<SVGSVGElement>;

export const socialIcons = {
  Instagram: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  TikTok: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M14 4c0 3 2 5 5 5" />
      <path d="M14 4v10.5a3.5 3.5 0 1 1-3-3.45" />
    </svg>
  ),
  YouTube: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Spotify: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 11c3.8-1.3 7.7-.9 10.8 1" strokeLinecap="round" />
      <path d="M7.8 14.2c2.8-.9 5.8-.6 8.1.7" strokeLinecap="round" />
      <path d="M8.8 17c2-.6 4.1-.4 5.8.4" strokeLinecap="round" />
    </svg>
  ),
  "Apple Music": (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M14.5 5.5v8.6a2.5 2.5 0 1 1-1-2V7.2l6-1.2v7.1a2.5 2.5 0 1 1-1-2V4.6z" />
    </svg>
  ),
  Linktree: (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M12 3v10" strokeLinecap="round" />
      <path d="M6 7l6 6 6-6" strokeLinecap="round" />
      <path d="M9 13l-3 3h6l-3 5" />
      <path d="M15 13l3 3h-6l3 5" />
    </svg>
  ),
} as const;

export type SocialLink = { label: string; href: string | null };

export function getSocialLinks(socials: readonly SocialLink[] = site.socials) {
  return socials.filter((social) => social.href && social.label in socialIcons);
}

export function SocialLinks({
  className = "",
  socials,
}: {
  className?: string;
  socials?: readonly SocialLink[];
}) {
  const links = getSocialLinks(socials);
  if (!links.length) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {links.map((social) => {
        const Icon = socialIcons[social.label as keyof typeof socialIcons];
        return (
          <li key={social.label}>
            <a
              href={social.href ?? undefined}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-text transition-colors hover:border-highlight hover:text-highlight focus-visible:text-highlight"
              target="_blank"
              rel="noreferrer"
              aria-label={social.label}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
