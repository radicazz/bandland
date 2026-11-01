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
    expect(screen.getByRole("link", { name: "Booking" })).toHaveAttribute(
      "href",
      "mailto:hello@example.com",
    );
    expect(screen.getByRole("link", { name: "Instagram" })).toBeInTheDocument();
  });
});
