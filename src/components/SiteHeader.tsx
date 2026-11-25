"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Container } from "@/components/Container";
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

  const navItems = [
    { href: "/", label: labels.nav.home },
    { href: "/shows", label: labels.nav.shows },
    { href: "/merch", label: labels.nav.merch },
  ] as const;
  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const barLink = (isActive: boolean) =>
    `inline-flex min-h-11 items-center text-xl font-extrabold tracking-tight text-text underline-offset-[7px] ${
      isActive
        ? "underline decoration-highlight decoration-[3px]"
        : "decoration-text decoration-2 hover:underline"
    }`;
  const localeButton = (isActive: boolean) =>
    `min-h-11 min-w-11 px-1 transition-colors motion-reduce:transition-none ${
      isActive ? "text-highlight" : "text-text hover:underline hover:underline-offset-[7px]"
    }`;

  return (
    <header className="sticky top-0 z-30 bg-bg">
      <Container className="relative">
        <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-b-2 border-text lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8">
          <div className="relative flex min-w-0 items-center" ref={menuRef}>
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              onClick={() => closeMenu()}
              className={`${barLink(pathname === "/")} lg:hidden`}
            >
              {labels.nav.home}
            </Link>
            <nav aria-label={labels.nav.explore} className="hidden items-center gap-10 lg:flex">
              {navItems.map((item) => {
                const isActive = isCurrent(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={barLink(isActive)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div
              id={menuId}
              aria-hidden={!isMenuOpen}
              inert={!isMenuOpen}
              className={`fixed inset-x-0 top-16 z-20 w-full px-4 pt-3 transition duration-200 motion-reduce:transition-none lg:hidden ${
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
                  className="menu-scroll max-h-[calc(100svh-5.5rem)] overflow-y-auto border-2 border-text bg-bg p-4 shadow-[6px_6px_0_0_var(--text)]"
                >
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="min-h-11 px-3 text-base font-bold text-text hover:underline hover:underline-offset-4"
                      onClick={() => closeMenu({ returnFocus: true })}
                    >
                      {labels.common.closeMenu}
                    </button>
                  </div>
                  <ul className="grid gap-1">
                    {navItems.map(({ href, label }) => {
                      const isActive = isCurrent(href);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            aria-current={isActive ? "page" : undefined}
                            className={`headline flex min-h-14 items-center px-2 text-4xl underline-offset-[6px] ${
                              isActive
                                ? "underline decoration-highlight decoration-[4px]"
                                : "decoration-text decoration-2 hover:underline"
                            }`}
                            onClick={() => closeMenu({ returnFocus: isActive })}
                          >
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {socialLinks.length ? (
                    <div className="mt-4 border-t-2 border-text pt-4 lg:hidden">
                      <p className="kicker px-2">{labels.nav.socials}</p>
                      <ul className="mt-2 flex flex-wrap gap-x-5 px-2">
                        {socialLinks.map((social) => (
                          <li key={social.label}>
                            <a
                              className="inline-flex min-h-11 items-center gap-1 text-lg font-bold text-text underline-offset-4 hover:underline"
                              href={social.href ?? undefined}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${social.label} (${labels.common.opensInNewTab})`}
                            >
                              {social.label}
                              <span aria-hidden>{"\u2197\uFE0E"}</span>
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
            className={`fixed inset-0 top-16 z-10 bg-bg/95 transition-opacity duration-200 motion-reduce:transition-none lg:hidden ${
              isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
          <div inert={isMenuOpen && isMobileViewport} className="justify-self-end">
            <div
              role="group"
              aria-label={labels.nav.language}
              className="flex shrink-0 items-center text-xl font-extrabold tracking-tight"
            >
              <button
                type="button"
                aria-pressed={locale === "en"}
                onClick={() => setLocale("en")}
                className={localeButton(locale === "en")}
              >
                ENG
              </button>
              <span aria-hidden className="text-text">
                /
              </span>
              <button
                type="button"
                aria-pressed={locale === "af"}
                onClick={() => setLocale("af")}
                className={localeButton(locale === "af")}
              >
                AFR
              </button>
            </div>
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            aria-haspopup="dialog"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="-mr-2 flex h-11 w-11 items-center justify-center text-text lg:hidden"
          >
            <span className="sr-only">
              {isMenuOpen ? labels.common.closeMenu : labels.common.openMenu}
            </span>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
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
