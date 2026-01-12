import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "../app/page";
import { site } from "../config/site";

describe("home", () => {
  it("renders the landing content", async () => {
    const view = await Home();
    render(view);
    expect(screen.getAllByText(/Under construction/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: site.name })).toBeInTheDocument();
  });
});
