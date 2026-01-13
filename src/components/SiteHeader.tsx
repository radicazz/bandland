"use client";

import type { SVGProps } from "react";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Container } from "@/components/Container";
import { site } from "@/config/site";
import type { Locale, Translations } from "@/i18n/translations";
import { LOCALE_COOKIE } from "@/i18n/translations";

type IconProps = SVGProps<SVGSVGElement>;

const socialIcons = {
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

type SiteHeaderProps = {
  locale: Locale;
  labels: Translations;
};

export function SiteHeader({ locale, labels }: SiteHeaderProps) {
  const socialLinks = site.socials.filter(
    (social) => social.href && social.label in socialIcons,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTabIndex = isMenuOpen ? 0 : -1;
  const router = useRouter();

  const setLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-bg/50 backdrop-blur-md">
      <Container className="relative flex h-16 items-center">
        <div className="order-1 flex items-center gap-4 sm:order-none">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls={menuId}
              aria-haspopup="menu"
              id={menuButtonId}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex min-h-11 items-center gap-2 px-2 text-lg font-brand tracking-[0.18em] text-text transition-colors hover:text-highlight focus-visible:text-highlight"
            >
              {site.name}
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={`h-4 w-4 text-text-dim transition-transform duration-200 ${
                  isMenuOpen ? "rotate-180 text-highlight" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" fill="currentColor" />
              </svg>
            </button>
            <div
              id={menuId}
              className={`fixed left-0 right-0 top-16 z-20 w-full px-4 pt-4 transition duration-200 sm:absolute sm:left-0 sm:right-auto sm:top-full sm:w-64 sm:px-0 sm:pt-3 ${
                isMenuOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <nav
                aria-label={labels.nav.explore}
                aria-hidden={!isMenuOpen}
                className="rounded-2xl border border-border/70 bg-surface/90 p-5 sm:menu-scroll sm:max-h-[60vh] sm:overflow-y-auto sm:p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">
                  {labels.nav.explore}
                </p>
                <ul className="mt-3 grid gap-3">
                  <li>
                    <Link
                      href="/"
                      className="menu-tile"
                      tabIndex={menuTabIndex}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="block text-[10px] uppercase tracking-[0.4em] text-text-dim">
                        {labels.nav.main}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-text">
                        {labels.nav.home}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/merch"
                      className="menu-tile"
                      tabIndex={menuTabIndex}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="block text-[10px] uppercase tracking-[0.4em] text-text-dim">
                        {labels.nav.store}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-text">
                        {labels.nav.merch}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/shows"
                      className="menu-tile"
                      tabIndex={menuTabIndex}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="block text-[10px] uppercase tracking-[0.4em] text-text-dim">
                        {labels.nav.live}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-text">
                        {labels.nav.shows}
                      </span>
                    </Link>
                  </li>
                </ul>
                {socialLinks.length ? (
                  <div className="mt-4 border-t border-border/60 pt-4 sm:hidden">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">
                      {labels.nav.socials}
                    </p>
                    <ul className="mt-3 grid grid-cols-4 gap-2">
                      {socialLinks.map((social) => {
                        const Icon = socialIcons[social.label as keyof typeof socialIcons];
                        return (
                          <li key={social.label}>
                            <a
                              className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-surface/30 text-text transition-colors hover:border-highlight/60 hover:text-highlight focus-visible:text-highlight"
                              href={social.href ?? undefined}
                              target="_blank"
                              rel="noreferrer"
                              tabIndex={menuTabIndex}
                              aria-label={social.label}
                            >
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </nav>
            </div>
          </div>
        </div>
        <div className="order-2 ml-auto hidden items-center sm:order-none sm:flex">
          <ul className="flex items-center gap-2 text-text-dim">
            {socialLinks.map((social) => {
              const Icon = socialIcons[social.label as keyof typeof socialIcons];
              return (
                <li key={social.label}>
                  <a
                    href={social.href ?? undefined}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/30 transition-colors hover:border-highlight/60 hover:text-highlight focus-visible:text-highlight"
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="order-3 ml-auto sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:ml-0 sm:order-none">
          <div
            role="group"
            aria-label={labels.nav.language}
            className="flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-surface/60 p-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-text-dim"
          >
            <button
              type="button"
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
              className={`rounded-full px-2 py-1 transition-colors ${
                locale === "en"
                  ? "bg-highlight/20 text-highlight"
                  : "text-text-dim hover:text-highlight focus-visible:text-highlight"
              }`}
            >
              ENG
            </button>
            <button
              type="button"
              aria-pressed={locale === "af"}
              onClick={() => setLocale("af")}
              className={`rounded-full px-2 py-1 transition-colors ${
                locale === "af"
                  ? "bg-highlight/20 text-highlight"
                  : "text-text-dim hover:text-highlight focus-visible:text-highlight"
              }`}
            >
              AFR
            </button>
          </div>
        </div>
      </Container>
    </header>
  );
}
