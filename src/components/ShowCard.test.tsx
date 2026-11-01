import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ShowCard } from "./ShowCard";
import { translations } from "@/i18n/translations";

afterEach(() => {
  cleanup();
});

const show = {
  date: "2027-07-24T20:30:00+02:00",
  venue: "Mercury Live",
  city: "Cape Town",
  price: "R200",
  priceOnline: "R180",
  priceDoor: "R220",
  ticketUrl: "https://tickets.example.com/mercury",
  imageUrl: "https://store.public.blob.vercel-storage.com/media/poster.webp",
};

describe("ShowCard", () => {
  it("renders complete posters in a stable portrait frame", () => {
    render(<ShowCard show={show} locale="en" labels={translations.en.shows} />);

    const image = screen.getByRole("img", { name: "Mercury Live show poster" });
    expect(image).toHaveClass("object-contain");
    expect(image.parentElement).toHaveClass("aspect-[2/3]");
  });

  it("uses split prices over the general fallback and disables preview links", () => {
    render(<ShowCard show={show} locale="en" labels={translations.en.shows} previewOnly />);

    expect(screen.getByText("R180")).toBeInTheDocument();
    expect(screen.getByText("R220")).toBeInTheDocument();
    expect(screen.queryByText("R200")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Tickets preview")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tickets" })).not.toBeInTheDocument();
  });

  it("marks the next show and offers calendar and named ticket links", () => {
    render(<ShowCard show={show} locale="en" labels={translations.en.shows} isNext />);
    expect(screen.getByText("Next show")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Add to calendar: Mercury Live/ })).toHaveAttribute(
      "download",
      "schmat-2027-07-24.ics",
    );
    expect(
      screen.getByRole("link", { name: "Tickets: Mercury Live (opens in a new tab)" }),
    ).toBeInTheDocument();
  });

  it("does not offer calendar links for past shows", () => {
    render(<ShowCard show={show} locale="en" labels={translations.en.shows} isPast />);
    expect(screen.queryByRole("link", { name: /calendar/i })).not.toBeInTheDocument();
  });
});
