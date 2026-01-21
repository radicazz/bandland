import { describe, expect, it } from "vitest";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit within the window", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    const first = limiter.check("ip", 0);
    const second = limiter.check("ip", 1);
    const third = limiter.check("ip", 2);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    const first = limiter.check("ip", 0);
    const second = limiter.check("ip", 1001);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("prefers x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "9.8.7.6" });
    expect(getClientIp(headers)).toBe("9.8.7.6");
  });

  it("returns unknown when no headers exist", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });
});
