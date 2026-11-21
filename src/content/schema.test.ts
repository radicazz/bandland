import { describe, expect, it } from "vitest";
import { merchInputSchema, merchItemSchema, showInputSchema, showSchema } from "./schema";

const date = "2027-03-15T18:00:00Z";
const record = { id: "70164137-f515-40b9-be69-d059f433bf21", createdAt: date, updatedAt: date };

describe("published links", () => {
  it("requires HTTPS for ticket and store links on new saves", () => {
    const show = { date, venue: "Mercury Live", city: "Cape Town", hasHappened: false };
    const merch = { name: "Shirt", price: "R200" };
    expect(showInputSchema.safeParse({ ...show, ticketUrl: "https://example.com" }).success).toBe(
      true,
    );
    expect(showInputSchema.safeParse({ ...show, ticketUrl: "http://example.com" }).success).toBe(
      false,
    );
    expect(merchInputSchema.safeParse({ ...merch, href: "ftp://example.com" }).success).toBe(false);
  });

  it("can still load records with legacy URLs so they can be fixed in admin", () => {
    expect(
      showSchema.safeParse({
        ...record,
        date,
        venue: "Mercury Live",
        city: "Cape Town",
        ticketUrl: "http://example.com",
      }).success,
    ).toBe(true);
    expect(
      merchItemSchema.safeParse({
        ...record,
        name: "Shirt",
        price: "R200",
        href: "ftp://example.com",
      }).success,
    ).toBe(true);
  });
});
