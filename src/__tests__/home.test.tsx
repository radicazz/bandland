import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "../app/page";
import { site } from "../config/site";

vi.mock("../components/HomeCarousel", () => ({
  HomeCarousel: function HomeCarouselMock() {
    return (
      <div>
        <h2>Merch</h2>
        <h2>Shows</h2>
      </div>
    );
  },
}));

describe("home", () => {
  it("renders the landing content", async () => {
    const view = await Home();
    render(view);
    expect(screen.getByRole("heading", { name: /Merch/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Shows/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: site.name })).toBeInTheDocument();
  });
});
