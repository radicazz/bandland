import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkRateLimit = vi.hoisted(() => vi.fn());
vi.mock("@vercel/firewall", () => ({ checkRateLimit }));

import { getAdminLoginLimit } from "./admin-login-limit";

const request = (path: string) =>
  new Request(`https://untrusted.example${path}`, {
    headers: { "x-real-ip": "203.0.113.7", host: "untrusted.example", cookie: "sensitive=value" },
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "bandland.example");
});

afterEach(() => vi.unstubAllEnvs());

describe("getAdminLoginLimit", () => {
  it("checks the same bucket from the form and the credentials endpoint", async () => {
    checkRateLimit
      .mockResolvedValueOnce({ rateLimited: false })
      .mockResolvedValueOnce({ rateLimited: true });

    await expect(getAdminLoginLimit(request("/admin"))).resolves.toBe("allowed");
    await expect(getAdminLoginLimit(request("/api/auth/callback/credentials"))).resolves.toBe(
      "rate_limited",
    );
    expect(checkRateLimit.mock.calls).toEqual(
      Array.from({ length: 2 }, () => [
        "bandland-admin-login",
        { headers: { host: "bandland.example", "x-real-ip": "203.0.113.7" }, timeout: 1000 },
      ]),
    );
  });

  it("blocks sign-in when the firewall rule is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    checkRateLimit.mockResolvedValue({ rateLimited: false, error: "not-found" });
    await expect(getAdminLoginLimit(request("/admin"))).resolves.toBe("rate_limit_unavailable");
    vi.restoreAllMocks();
  });

  it("allows local sign-in without contacting Vercel", async () => {
    vi.stubEnv("VERCEL", "");
    await expect(getAdminLoginLimit(request("/admin"))).resolves.toBe("allowed");
    expect(checkRateLimit).not.toHaveBeenCalled();
  });
});
