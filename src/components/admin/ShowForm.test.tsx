import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ShowForm } from "./ShowForm";
import type { Show } from "@/content/schema";

afterEach(() => {
  cleanup();
});

const noopAction = async () => ({ status: "idle" as const });

const baseShow: Show = {
  id: "70164137-f515-40b9-be69-d059f433bf21",
  date: "2026-03-15T20:00:00+02:00",
  hasHappened: true,
  venue: "The Waiting Room",
  city: "Cape Town, WC",
  price: "R200",
  ticketUrl: "https://example.com/tickets/show-1",
  imageUrl: "https://example.com/images/shows/waiting-room.jpg",
  createdAt: "2026-01-21T00:00:00Z",
  updatedAt: "2026-01-21T16:47:08.839Z",
};

describe("ShowForm", () => {
  it("renders the has happened checkbox unchecked by default for new shows", () => {
    render(<ShowForm action={noopAction} submitLabel="Create show" />);

    const checkbox = screen.getByRole("checkbox", { name: /already happened/i });
    expect(checkbox).not.toBeChecked();
  });

  it("renders the has happened checkbox checked for existing shows when true", () => {
    render(<ShowForm action={noopAction} submitLabel="Save changes" initialValues={baseShow} />);

    const checkbox = screen.getByRole("checkbox", { name: /already happened/i });
    expect(checkbox).toBeChecked();
  });
});
