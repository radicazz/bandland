import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  password: z.string().min(1),
});

const loginLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

class AdminSignInError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

const authSecret = process.env.AUTH_SECRET?.trim();
const isProduction = process.env.NODE_ENV === "production";
const sessionCookieName = isProduction
  ? "__Host-bandland-admin"
  : "bandland-admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(authSecret ? { secret: authSecret } : {}),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },
  pages: {
    signIn: "/admin",
  },
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: isProduction,
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          console.error("[Auth] Invalid credentials schema");
          return null;
        }

        const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
        if (!passwordHash) {
          console.error("[Auth] ADMIN_PASSWORD_HASH missing from environment");
          throw new AdminSignInError("missing_hash");
        }

        console.log("[Auth] Hash loaded, length:", passwordHash.length);

        const headers = request?.headers ?? new Headers();
        const ip = getClientIp(headers);
        const { allowed } = loginLimiter.check(ip);
        if (!allowed) {
          console.error("[Auth] Rate limited:", ip);
          throw new AdminSignInError("rate_limited");
        }

        const normalizedPassword = parsed.data.password.trim();
        if (!normalizedPassword) {
          console.error("[Auth] Empty password after trim");
          throw new AdminSignInError("missing_password");
        }

        console.log("[Auth] Comparing password, input length:", normalizedPassword.length);
        const isValid = await bcrypt.compare(normalizedPassword, passwordHash);
        console.log("[Auth] Password valid:", isValid);
        
        if (!isValid) {
          throw new AdminSignInError("invalid_password");
        }

        return { id: "admin", name: "Admin" };
      },
    }),
  ],
});

export const { GET, POST } = handlers;
