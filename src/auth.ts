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

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
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
      name: "__Host-bandland-admin",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
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
          return null;
        }

        const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
        if (!passwordHash) {
          throw new AdminSignInError("missing_hash");
        }

        const headers = request?.headers ?? new Headers();
        const ip = getClientIp(headers);
        const { allowed } = loginLimiter.check(ip);
        if (!allowed) {
          throw new AdminSignInError("rate_limited");
        }

        const normalizedPassword = parsed.data.password.trim();
        if (!normalizedPassword) {
          throw new AdminSignInError("missing_password");
        }

        const isValid = await bcrypt.compare(normalizedPassword, passwordHash);
        if (!isValid) {
          throw new AdminSignInError("invalid_password");
        }

        return { id: "admin", name: "Admin" };
      },
    }),
  ],
});
