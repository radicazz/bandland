import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "../app/page";

vi.mock("@/content/settings", async () => {
  const { getDefaultSettings } = await import("@/content/settings-defaults");
  return { getSiteSettings: async () => getDefaultSettings() };
});

vi.mock("@/components/home/HomeZine", () => ({
  HomeZine: function HomeZineMock({ locale }: { locale: string }) {
    return <h1>Zine {locale}</h1>;
  },
}));

afterEach(() => {
  cleanup();
});

describe("home", () => {
  it("renders the zine home with the current locale", async () => {
    render(await Home());
    expect(screen.getByRole("heading", { level: 1, name: "Zine en" })).toBeInTheDocument();
  });
});
