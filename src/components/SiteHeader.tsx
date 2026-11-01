"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Container } from "@/components/Container";
import { site } from "@/config/site";
import { getSocialLinks, socialIcons } from "@/components/SocialLinks";
import type { Locale, Translations } from "@/i18n/translations";
import { LOCALE_COOKIE } from "@/i18n/translations";

type SiteHeaderProps = {
  locale: Locale;
  labels: Translations;
};

export function SiteHeader({ locale, labels }: SiteHeaderProps) {
  const socialLinks = getSocialLinks();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const menuTabIndex = isMenuOpen ? 0 : -1;

  const closeMenu = ({ returnFocus = false }: { returnFocus?: boolean } = {}) => {
    setIsMenuOpen(false);
    if (returnFocus) {
      menuButtonRef.current?.focus();
    }
  };

  const setLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const updateViewport = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
      if (!event.matches) setIsMenuOpen(false);
    };

    updateViewport(mediaQuery);
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (pathnameRef.current === pathname) {
      return;
    }

    pathnameRef.current = pathname;
    const frameId = window.requestAnimationFrame(() => {
      setIsMenuOpen(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const getFocusableElements = () => {
      const panel = menuPanelRef.current;
      if (!panel) {
        return [];
      }

      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    };

    let focusFrameId: number | undefined;
    if (isMobileViewport) {
      focusFrameId = window.requestAnimationFrame(() => {
        getFocusableElements()[0]?.focus();
      });
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !menuButtonRef.current?.contains(target)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu({ returnFocus: true });
        return;
      }

      if (!isMobileViewport || event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (focusFrameId !== undefined) window.cancelAnimationFrame(focusFrameId);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, isMobileViewport]);

  useEffect(() => {
    if (!isMenuOpen || !isMobileViewport) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen, isMobileViewport]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-md">
      <Container className="relative">
        <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 lg:grid-cols-[auto_1fr_auto] lg:gap-3">
          <div className="relative min-w-0" ref={menuRef}>
            <Link
              href="/"
              onClick={() => closeMenu()}
              className="group flex min-h-11 min-w-0 items-center gap-3 font-brand text-2xl leading-none text-text transition-colors hover:text-highlight"
            >
              <Image
                src="/logos/schmat-rat.png"
                alt=""
                width={32}
                height={32}
                className="h-9 w-9 shrink-0 rounded-md border border-border bg-surface p-0.5"
              />
              <span className="truncate">{site.name}</span>
            </Link>
            <div
              id={menuId}
              aria-hidden={!isMenuOpen}
              inert={!isMenuOpen}
              className={`fixed inset-x-0 top-16 z-20 w-full px-4 pt-3 transition duration-200 lg:hidden ${
                isMenuOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <div
                ref={menuPanelRef}
                role={isMobileViewport ? "dialog" : undefined}
                aria-modal={isMobileViewport ? "true" : undefined}
                aria-label={labels.nav.explore}
              >
                <nav
                  aria-label={labels.nav.explore}
                  aria-hidden={!isMenuOpen}
                  className="menu-scroll max-h-[calc(100svh-5.5rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-2xl"
                >
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="min-h-11 rounded-lg px-3 text-base font-medium text-text-muted hover:text-text"
                      tabIndex={menuTabIndex}
                      onClick={() => closeMenu({ returnFocus: true })}
                    >
                      {labels.common.closeMenu}
                    </button>
                  </div>
                  <ul className="grid gap-1">
                    {(
                      [
                        { href: "/", label: labels.nav.home },
                        { href: "/shows", label: labels.nav.shows },
                        { href: "/merch", label: labels.nav.merch },
                      ] as const
                    ).map(({ href, label }) => {
                      const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex min-h-14 items-center justify-between rounded-xl px-4 text-2xl font-semibold transition-colors ${
                              isActive
                                ? "bg-surface-2 text-text"
                                : "text-text-muted hover:bg-surface-2 hover:text-text"
                            }`}
                            tabIndex={menuTabIndex}
                            onClick={() => closeMenu()}
                          >
                            {label}
                            {isActive ? (
                              <span aria-hidden className="h-2 w-2 rounded-full bg-highlight" />
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {socialLinks.length ? (
                    <div className="mt-3 border-t border-border pt-4 lg:hidden">
                      <p className="px-4 text-sm font-semibold text-text-dim">
                        {labels.nav.socials}
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2 px-4">
                        {socialLinks.map((social) => {
                          const Icon = socialIcons[social.label as keyof typeof socialIcons];
                          return (
                            <li key={social.label}>
                              <a
                                className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-surface-2 text-text transition-colors hover:border-text-dim"
                                href={social.href ?? undefined}
                                target="_blank"
                                rel="noreferrer"
                                tabIndex={menuTabIndex}
                                aria-label={social.label}
                              >
                                <Icon className="h-5 w-5" aria-hidden="true" />
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
          <div
            aria-hidden="true"
            className={`fixed inset-0 top-16 z-10 bg-bg/90 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
              isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
          <nav
            aria-label={labels.nav.explore}
            className="hidden items-center justify-center gap-1 lg:col-start-2 lg:row-start-1 lg:flex"
          >
            {(
              [
                { href: "/", label: labels.nav.home },
                { href: "/shows", label: labels.nav.shows },
                { href: "/merch", label: labels.nav.merch },
              ] as const
            ).map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`min-h-11 border-b-2 px-4 py-2 text-base font-medium transition-colors ${
                    isActive
                      ? "border-highlight text-text"
                      : "border-transparent text-text-muted hover:text-text"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div
            inert={isMenuOpen && isMobileViewport}
            className="justify-self-end lg:col-start-3 lg:row-start-1"
          >
            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label={labels.nav.language}
                className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5 text-sm font-semibold text-text-muted"
              >
                <button
                  type="button"
                  aria-pressed={locale === "en"}
                  onClick={() => setLocale("en")}
                  className={`min-h-10 min-w-11 rounded-md px-2.5 py-1 transition-colors ${
                    locale === "en" ? "bg-text text-bg" : "text-text-muted hover:text-text"
                  }`}
                >
                  ENG
                </button>
                <button
                  type="button"
                  aria-pressed={locale === "af"}
                  onClick={() => setLocale("af")}
                  className={`min-h-10 min-w-11 rounded-md px-2.5 py-1 transition-colors ${
                    locale === "af" ? "bg-text text-bg" : "text-text-muted hover:text-text"
                  }`}
                >
                  AFR
                </button>
              </div>
              {socialLinks.length ? (
                <ul className="hidden items-center gap-2 text-text-dim lg:flex">
                  {socialLinks.map((social) => {
                    const Icon = socialIcons[social.label as keyof typeof socialIcons];
                    return (
                      <li key={social.label}>
                        <a
                          href={social.href ?? undefined}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface transition-colors hover:border-text-dim hover:text-text"
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
              ) : null}
            </div>
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            aria-haspopup="dialog"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`flex h-11 w-11 items-center justify-center rounded-lg border bg-surface text-text transition-colors hover:border-text-dim lg:hidden ${
              isMenuOpen ? "border-text-dim" : "border-border"
            }`}
          >
            <span className="sr-only">
              {isMenuOpen ? labels.common.closeMenu : labels.common.openMenu}
            </span>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              {isMenuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </Container>
    </header>
  );
}
