import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "../app/page";

describe("home", () => {
  it("renders the landing content", () => {
    render(<Home />);
    expect(screen.getByText(/To get started, edit the page\.tsx file\./i)).toBeInTheDocument();
  });
});
