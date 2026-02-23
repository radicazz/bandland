import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./SiteHeader";
import { translations } from "@/i18n/translations";

const nav = vi.hoisted(() => ({
  pathname: "/",
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: nav.refresh }),
  usePathname: () => nav.pathname,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  nav.pathname = "/";
  nav.refresh.mockReset();
  document.cookie = "";
  document.body.style.overflow = "";
});

describe("SiteHeader", () => {
  it("opens and closes the menu via button, escape, and outside press", () => {
    render(<SiteHeader locale="en" labels={translations.en} />);

    const menuButton = screen.getByRole("button", { name: /schm/i });
    const homeLink = screen
      .getByText(translations.en.nav.home)
      .closest("a") as HTMLAnchorElement;

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(homeLink).toHaveAttribute("tabindex", "-1");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(homeLink).toHaveAttribute("tabindex", "0");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(homeLink).toHaveAttribute("tabindex", "-1");

    fireEvent.click(menuButton);
    fireEvent.pointerDown(document.body);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("updates locale cookie and refreshes the route", () => {
    render(<SiteHeader locale="en" labels={translations.en} />);

    fireEvent.click(screen.getByRole("button", { name: "AFR" }));

    expect(document.cookie).toContain("bandland-locale=af");
    expect(nav.refresh).toHaveBeenCalledTimes(1);
  });
});
