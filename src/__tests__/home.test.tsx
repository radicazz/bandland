import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "../app/page";
import { site } from "../config/site";

describe("home", () => {
  it("renders the landing content", async () => {
    const view = await Home();
    render(view);
    expect(screen.getByRole("heading", { name: /Merch/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Shows/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: site.name })).toBeInTheDocument();
  });
});
