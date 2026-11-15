import { site } from "@/config/site";

export type SocialLink = { label: string; href: string | null };

export function getSocialLinks(socials: readonly SocialLink[] = site.socials) {
  return socials.filter((social) => social.href);
}

/** Text links: the platform names are the recognizable part, so no redrawn brand marks. */
export function SocialLinks({
  className = "",
  socials,
  newTabLabel = "opens in a new tab",
}: {
  className?: string;
  socials?: readonly SocialLink[];
  newTabLabel?: string;
}) {
  const links = getSocialLinks(socials);
  if (!links.length) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-x-5 ${className}`}>
      {links.map((social) => (
        <li key={social.label}>
          <a
            href={social.href ?? undefined}
            className="inline-flex min-h-11 items-center text-base font-medium text-text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
            target="_blank"
            rel="noreferrer"
            aria-label={`${social.label} (${newTabLabel})`}
          >
            {social.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
