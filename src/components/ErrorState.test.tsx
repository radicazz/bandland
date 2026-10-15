import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorMessagesProvider } from "@/components/ErrorMessagesProvider";
import { ErrorState } from "@/components/ErrorState";
import { translations } from "@/i18n/translations";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ErrorState", () => {
  it("uses the current locale after a language change and retries the failed route", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    const error = Object.assign(new Error("Storage unavailable"), { digest: "abc123" });
    const view = (locale: "en" | "af") => (
      <ErrorMessagesProvider labels={translations[locale].errors}>
        <ErrorState error={error} reset={reset} scope="shows" />
      </ErrorMessagesProvider>
    );
    const { rerender } = render(view("en"));
    expect(
      screen.getByRole("heading", { name: translations.en.errors.shows.title }),
    ).toBeInTheDocument();
    rerender(view("af"));
    expect(
      screen.getByRole("heading", { name: translations.af.errors.shows.title }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: translations.af.errors.retry }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: translations.af.errors.home })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("Fout-ID: abc123")).toBeInTheDocument();
  });
});
