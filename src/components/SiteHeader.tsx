"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Container } from "@/components/Container";
import { site } from "@/config/site";
import { getSocialLinks, type SocialLink } from "@/components/SocialLinks";
import type { Locale, Translations } from "@/i18n/translations";
import { LOCALE_COOKIE } from "@/i18n/translations";

type SiteHeaderProps = {
  locale: Locale;
  labels: Translations;
  socials?: readonly SocialLink[];
};

export function SiteHeader({ locale, labels, socials }: SiteHeaderProps) {
  const socialLinks = getSocialLinks(socials);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const restoreBackgroundRef = useRef<(() => void) | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  const closeMenu = ({ returnFocus = false }: { returnFocus?: boolean } = {}) => {
    setIsMenuOpen(false);
    restoreBackgroundRef.current?.();
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
        closeMenu({ returnFocus: true });
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

    const siblings: Element[] = [];
    for (
      let node: Element | null = menuPanelRef.current;
      node && node !== document.body;
      node = node.parentElement
    ) {
      for (const sibling of Array.from(node.parentElement?.children ?? [])) {
        if (
          sibling === node ||
          sibling.hasAttribute("inert") ||
          sibling.hasAttribute("data-menu-backdrop")
        )
          continue;
        sibling.setAttribute("inert", "");
        siblings.push(sibling);
      }
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const restore = () => {
      for (const sibling of siblings) sibling.removeAttribute("inert");
      document.body.style.overflow = previousOverflow;
      restoreBackgroundRef.current = null;
    };
    restoreBackgroundRef.current = restore;
    return restore;
  }, [isMenuOpen, isMobileViewport]);

  return (
    <header className="site-header sticky top-0 z-30">
      <Container className="relative">
        <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 lg:gap-8">
          <div className="relative min-w-0" ref={menuRef}>
            <Link
              href="/"
              onClick={() => closeMenu()}
              className="group flex min-h-11 min-w-0 items-center gap-2.5 self-start justify-self-start font-brand text-[1.75rem] leading-none text-text transition-colors hover:text-highlight"
            >
              <Image
                src="/logos/schmat-rat.png"
                alt=""
                width={32}
                height={32}
                className="h-9 w-9 shrink-0 rounded-control"
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
                  className="menu-scroll max-h-[calc(100svh-5.5rem)] overflow-y-auto rounded-card border border-border bg-surface p-4 shadow-2xl"
                >
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="min-h-11 rounded-control px-3 text-base font-medium text-text-muted hover:text-text"
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
                            className={`flex min-h-14 items-center justify-between rounded-card px-4 text-2xl font-semibold transition-colors ${
                              isActive
                                ? "bg-surface-2 text-text"
                                : "text-text-muted hover:bg-surface-2 hover:text-text"
                            }`}
                            onClick={() => closeMenu({ returnFocus: isActive })}
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
                      <ul className="mt-2 flex flex-wrap gap-x-5 px-4">
                        {socialLinks.map((social) => (
                          <li key={social.label}>
                            <a
                              className="inline-flex min-h-11 items-center text-lg font-medium text-text-muted hover:text-text"
                              href={social.href ?? undefined}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${social.label} (${labels.common.opensInNewTab})`}
                            >
                              {social.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </nav>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            data-menu-backdrop
            className={`fixed inset-0 top-16 z-10 bg-bg/95 transition-opacity duration-200 lg:hidden ${
              isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
          <nav
            aria-label={labels.nav.explore}
            className="hidden items-center gap-6 lg:col-start-2 lg:row-start-1 lg:flex"
          >
            {(
              [
                { href: "/shows", label: labels.nav.shows },
                { href: "/merch", label: labels.nav.merch },
              ] as const
            ).map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center text-base font-semibold underline-offset-8 transition-colors ${
                    isActive
                      ? "text-text underline decoration-highlight decoration-2"
                      : "text-text-muted hover:text-text"
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
            <div className="flex items-center">
              <div
                role="group"
                aria-label={labels.nav.language}
                className="flex shrink-0 items-center text-sm font-semibold text-text-dim"
              >
                <button
                  type="button"
                  aria-pressed={locale === "en"}
                  onClick={() => setLocale("en")}
                  className={`min-h-11 min-w-11 px-1.5 transition-colors ${
                    locale === "en" ? "text-text" : "text-text-dim hover:text-text"
                  }`}
                >
                  ENG
                </button>
                <span aria-hidden className="text-border">
                  /
                </span>
                <button
                  type="button"
                  aria-pressed={locale === "af"}
                  onClick={() => setLocale("af")}
                  className={`min-h-11 min-w-11 px-1.5 transition-colors ${
                    locale === "af" ? "text-text" : "text-text-dim hover:text-text"
                  }`}
                >
                  AFR
                </button>
              </div>
            </div>
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            aria-haspopup="dialog"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-control text-text transition-colors hover:text-highlight lg:hidden"
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
