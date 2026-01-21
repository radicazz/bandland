type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function createRateLimiter({ limit, windowMs }: RateLimitOptions) {
  const hits = new Map<string, RateLimitEntry>();

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      const existing = hits.get(key);
      if (!existing || now > existing.resetAt) {
        const next: RateLimitEntry = { count: 1, resetAt: now + windowMs };
        hits.set(key, next);
        return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: next.resetAt };
      }

      const nextCount = existing.count + 1;
      const next: RateLimitEntry = { count: nextCount, resetAt: existing.resetAt };
      hits.set(key, next);
      return {
        allowed: nextCount <= limit,
        remaining: Math.max(0, limit - nextCount),
        resetAt: next.resetAt,
      };
    },
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}
