import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SiteFooter } from "@/components/SiteFooter";

afterEach(cleanup);

describe("SiteFooter", () => {
  it("links to the admin panel and uses the configured contact email", () => {
    render(
      <SiteFooter
        tagline="Loud"
        bookingLabel="Booking"
        contactEmail="hello@example.com"
        socials={[{ label: "Instagram", href: "https://instagram.com/x" }]}
      />,
    );
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    const booking = screen.getByRole("link", { name: "Booking: hello@example.com" });
    expect(booking).toHaveAttribute("href", "mailto:hello@example.com");
    expect(booking).toHaveTextContent("hello@example.com");
    expect(screen.getByRole("link", { name: "Instagram (opens in a new tab)" })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("pads for the player bar and drops socials without a link", () => {
    render(
      <SiteFooter
        tagline="Loud"
        bookingLabel="Booking"
        socials={[
          { label: "Instagram", href: "https://instagram.com/x" },
          { label: "TikTok", href: null },
        ]}
      />,
    );
    expect(screen.getByRole("contentinfo").className).toContain("pb-[var(--player-clear,0px)]");
    expect(screen.queryByRole("link", { name: /TikTok/ })).not.toBeInTheDocument();
  });
});
