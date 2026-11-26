import "server-only";

import { checkRateLimit } from "@vercel/firewall";

function getFirewallHost(request: Request) {
  const { VERCEL_ENV, VERCEL_PROJECT_PRODUCTION_URL: projectHost, VERCEL_URL } = process.env;
  if (VERCEL_ENV !== "production" || !projectHost) return VERCEL_URL;

  // The project URL is the shortest production domain. If that is an apex which redirects
  // to www, the SDK rejects the redirect. Never trust any other request host: the SDK
  // sends it the client IP and the protection bypass secret.
  return request.headers.get("host") === `www.${projectHost}` ? `www.${projectHost}` : projectHost;
}

export async function getAdminLoginLimit(request: Request) {
  if (process.env.VERCEL !== "1") return "allowed";

  const host = getFirewallHost(request);
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
