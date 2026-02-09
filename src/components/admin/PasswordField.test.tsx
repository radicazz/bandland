import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PasswordField } from "./PasswordField";

afterEach(() => {
  cleanup();
});

describe("PasswordField", () => {
  it("renders a password input with desktop/mobile responsive layout classes", () => {
    const { getByLabelText } = render(<PasswordField name="password" label="Password" required />);

    const input = getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("name", "password");

    expect(input.parentElement).toHaveClass("flex-col");
    expect(input.parentElement).toHaveClass("sm:flex-row");
  });

  it("toggles between masked and visible password states", () => {
    const { getByLabelText, getByRole } = render(
      <PasswordField name="password" label="Password" required />,
    );

    const input = getByLabelText("Password");
    const toggleButton = getByRole("button", { name: "Show password" });

    expect(toggleButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggleButton);

    expect(input).toHaveAttribute("type", "text");
    expect(toggleButton).toHaveAttribute("aria-pressed", "true");
    expect(getByRole("button", { name: "Hide password" })).toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(input).toHaveAttribute("type", "password");
    expect(toggleButton).toHaveAttribute("aria-pressed", "false");
  });
});
