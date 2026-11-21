import "server-only";

import { checkRateLimit } from "@vercel/firewall";

export async function getAdminLoginLimit(request: Request) {
  if (process.env.VERCEL !== "1") return "allowed";

  const host =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL;
  const clientIp = request.headers.get("x-real-ip");

  try {
    if (!host || !clientIp) throw new Error("Missing Vercel request context");
    const result = await checkRateLimit("bandland-admin-login", {
      // Use Vercel's deployment host and IP, without forwarding credentials or cookies.
      headers: { host, "x-real-ip": clientIp },
      timeout: 1_000,
    });
    if (result.error === "not-found") throw new Error("Missing bandland-admin-login firewall rule");
    return result.rateLimited ? "rate_limited" : "allowed";
  } catch (error) {
    console.error("[Auth] Admin login rate limit unavailable", error);
    return "rate_limit_unavailable";
  }
}
