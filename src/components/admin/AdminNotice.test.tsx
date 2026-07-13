import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminNotice } from "./AdminNotice";

afterEach(cleanup);

describe("AdminNotice", () => {
  it.each([
    ["created", "Show created successfully."],
    ["updated", "Show updated successfully."],
    ["deleted", "Show deleted successfully."],
  ])("reports a successful %s action", (value, message) => {
    render(<AdminNotice value={value} entity="Show" />);
    expect(screen.getByRole("status")).toHaveTextContent(message);
  });

  it("does not render for unknown status values", () => {
    render(<AdminNotice value="unexpected" entity="Show" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
