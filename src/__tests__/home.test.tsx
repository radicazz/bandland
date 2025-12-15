import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "../app/page";
import { site } from "../config/site";

describe("home", () => {
  it("renders the landing content", () => {
    render(<Home />);
    expect(screen.getByText(/Under construction/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: site.name })).toBeInTheDocument();
  });
});
