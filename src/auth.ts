import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getAdminLoginLimit } from "@/lib/admin-login-limit";
import { parseAdminPasswordHash } from "@/lib/admin-password-hash";

const credentialsSchema = z.object({
  password: z.string().min(1),
});

class AdminSignInError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

const authSecret = process.env.AUTH_SECRET?.trim();
const isProduction = process.env.NODE_ENV === "production";
const resolvedAuthSecret = authSecret || (isProduction ? undefined : "bandland-dev-auth-secret");
const sessionCookieName = isProduction ? "__Host-bandland-admin" : "bandland-admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(resolvedAuthSecret ? { secret: resolvedAuthSecret } : {}),
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

        const configuredHash = process.env.ADMIN_PASSWORD_HASH?.trim();
        if (!configuredHash) {
          console.error("[Auth] ADMIN_PASSWORD_HASH missing from environment");
          throw new AdminSignInError("missing_hash");
        }

        const passwordHash = parseAdminPasswordHash(configuredHash);
        if (!passwordHash) {
          console.error("[Auth] ADMIN_PASSWORD_HASH is not a bcrypt hash");
          throw new AdminSignInError("invalid_hash");
        }

        const normalizedPassword = parsed.data.password.trim();
        if (!normalizedPassword) {
          console.error("[Auth] Empty password after trim");
          throw new AdminSignInError("missing_password");
        }

        const limit = await getAdminLoginLimit(request);
        if (limit !== "allowed") throw new AdminSignInError(limit);

        const isValid = await bcrypt.compare(normalizedPassword, passwordHash);

        if (!isValid) {
          throw new AdminSignInError("invalid_password");
        }

        return { id: "admin", name: "Admin" };
      },
    }),
  ],
});

export const { GET, POST } = handlers;
