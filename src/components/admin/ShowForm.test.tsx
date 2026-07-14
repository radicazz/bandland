import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ShowForm } from "./ShowForm";
import type { Show } from "@/content/schema";
import { translations } from "@/i18n/translations";

afterEach(() => {
  cleanup();
});

const noopAction = async () => ({ status: "idle" as const });

const baseShow: Show = {
  id: "70164137-f515-40b9-be69-d059f433bf21",
  date: "2026-03-15T20:00:00+02:00",
  hasHappened: true,
  timeFrame: "6pm - late",
  venue: "The Waiting Room",
  city: "Cape Town, WC",
  price: "R200",
  priceOnline: "R180",
  priceDoor: "R220",
  ticketUrl: "https://example.com/tickets/show-1",
  imageUrl: "https://example.com/images/shows/waiting-room.jpg",
  createdAt: "2026-01-21T00:00:00Z",
  updatedAt: "2026-01-21T16:47:08.839Z",
};

describe("ShowForm", () => {
  it("renders the has happened checkbox unchecked by default for new shows", () => {
    render(
      <ShowForm
        action={noopAction}
        labels={translations.en.shows}
        locale="en"
        submitLabel="Create show"
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: /already happened/i });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByLabelText(/time frame/i)).toHaveValue("");
    expect(screen.getByLabelText(/online price/i)).toHaveValue("");
    expect(screen.getByLabelText(/door price/i)).toHaveValue("");
  });

  it("renders existing show status and pricing fields when editing", () => {
    render(
      <ShowForm
        action={noopAction}
        labels={translations.en.shows}
        locale="en"
        submitLabel="Save changes"
        initialValues={baseShow}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: /already happened/i });
    expect(checkbox).toBeChecked();
    expect(screen.getByLabelText(/time frame/i)).toHaveValue("6pm - late");
    expect(screen.getByLabelText(/online price/i)).toHaveValue("R180");
    expect(screen.getByLabelText(/door price/i)).toHaveValue("R220");
    expect(screen.getByLabelText(/general price/i)).toHaveValue("R200");
  });

  it("updates the public show card preview while fields change", () => {
    render(
      <ShowForm
        action={noopAction}
        labels={translations.en.shows}
        locale="en"
        submitLabel="Create show"
      />,
    );

    fireEvent.change(screen.getByLabelText(/^venue/i), { target: { value: "Mercury Live" } });
    fireEvent.change(screen.getByLabelText(/^city/i), { target: { value: "Cape Town" } });
    fireEvent.change(screen.getByLabelText(/^date/i), { target: { value: "2027-07-24" } });
    fireEvent.change(screen.getByLabelText(/^time$/i), { target: { value: "20:30" } });
    fireEvent.change(screen.getByLabelText(/online price/i), { target: { value: "R180" } });
    fireEvent.change(screen.getByLabelText(/ticket url/i), {
      target: { value: "https://tickets.example.com/mercury" },
    });

    expect(screen.getAllByText("Mercury Live")).toHaveLength(1);
    expect(screen.getAllByText("Cape Town")).toHaveLength(1);
    expect(screen.getByText(/Saturday, 24 July 2027/i)).toBeInTheDocument();
    expect(screen.getByText("R180")).toBeInTheDocument();
    expect(screen.getByLabelText("Tickets preview")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tickets" })).not.toBeInTheDocument();
  });
});
