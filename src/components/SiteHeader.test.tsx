import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  vi.restoreAllMocks();
});

beforeEach(() => {
  nav.pathname = "/";
  nav.refresh.mockReset();
  document.cookie = "";
  document.body.style.overflow = "";
  vi.spyOn(window, "matchMedia").mockReturnValue({
    ...window.matchMedia("(max-width: 1023px)"),
    matches: true,
  });
});

describe("SiteHeader", () => {
  it("opens and closes the menu via button, escape, and outside press", () => {
    render(<SiteHeader locale="en" labels={translations.en} />);

    const menuButton = screen.getByRole("button", { name: /open menu/i });
    const homeLink = screen
      .getAllByText(translations.en.nav.home)
      .map((element) => element.closest("a"))
      .find((link) => link?.getAttribute("tabindex") === "-1") as HTMLAnchorElement;

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(homeLink).toHaveAttribute("tabindex", "-1");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(menuButton).toHaveAccessibleName(/close menu/i);
    expect(homeLink).toHaveAttribute("tabindex", "0");
    expect(document.body.style.overflow).toBe("hidden");

    homeLink.focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(homeLink).toHaveAttribute("tabindex", "-1");
    expect(menuButton).toHaveFocus();

    fireEvent.click(menuButton);
    fireEvent.pointerDown(document.body);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the menu when the route changes", async () => {
    const { rerender } = render(<SiteHeader locale="en" labels={translations.en} />);

    const menuButton = screen.getByRole("button", { name: /open menu/i });

    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    nav.pathname = "/shows";
    rerender(<SiteHeader locale="en" labels={translations.en} />);

    await waitFor(() => {
      expect(menuButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("updates locale cookie and refreshes the route", () => {
    render(<SiteHeader locale="en" labels={translations.en} />);

    fireEvent.click(screen.getByRole("button", { name: "AFR" }));

    expect(document.cookie).toContain("bandland-locale=af");
    expect(nav.refresh).toHaveBeenCalledTimes(1);
  });

  it("closes the compact menu and restores scrolling when resizing to desktop", () => {
    document.body.style.overflow = "auto";
    render(<SiteHeader locale="af" labels={translations.af} />);
    const button = screen.getByRole("button", { name: /Maak kieslys oop/i });
    fireEvent.click(button);
    expect(document.body.style.overflow).toBe("hidden");
    const query = vi.mocked(window.matchMedia).mock.results[0]?.value as MediaQueryList;
    const listener = vi.mocked(query.addEventListener).mock.calls[0]?.[1];
    act(() => {
      if (typeof listener === "function")
        listener.call(query, { matches: false } as MediaQueryListEvent);
    });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).toBe("auto");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("contains keyboard focus and returns it to the opener when closed", async () => {
    render(<SiteHeader locale="en" labels={translations.en} />);
    const opener = screen.getByRole("button", { name: /open menu/i });
    fireEvent.click(opener);
    const dialog = screen.getByRole("dialog");
    const close = within(dialog).getByRole("button", { name: "Close menu" });
    await waitFor(() => expect(close).toHaveFocus());
    const links = within(dialog).getAllByRole("link");
    const last = links.at(-1);
    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });
});
