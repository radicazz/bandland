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
    <ul className={`flex flex-wrap items-center gap-x-6 gap-y-1 ${className}`}>
      {links.map((social) => (
        <li key={social.label}>
          <a
            href={social.href ?? undefined}
            className="inline-flex min-h-11 items-center gap-1 text-lg font-extrabold tracking-tight text-text underline-offset-[6px] hover:underline"
            target="_blank"
            rel="noreferrer"
            aria-label={`${social.label} (${newTabLabel})`}
          >
            {social.label}
            <span aria-hidden className="text-base text-text-dim">
              {"↗︎"}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
