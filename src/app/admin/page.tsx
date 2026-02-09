import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, auth } from "@/auth";
import { Container } from "@/components/Container";
import { PasswordField } from "@/components/admin/PasswordField";

type AdminPageProps = {
  searchParams?: Promise<{
    error?: string;
    code?: string;
  }>;
};

async function authenticate(formData: FormData) {
  "use server";
  const passwordValue = formData.get("password");

  const password = typeof passwordValue === "string" ? passwordValue.trim() : "";

  if (password.length === 0) {
    redirect("/admin?error=missing");
  }

  try {
    await signIn("credentials", { password, redirectTo: "/admin/dashboard" });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      redirect(`/admin?error=credentials&code=${encodeURIComponent(error.code)}`);
    }
    if (error instanceof AuthError) {
      const type =
        typeof error.type === "string" && error.type.length > 0 ? error.type : "AuthError";
      redirect(`/admin?error=auth&code=${encodeURIComponent(type)}`);
    }
    throw error;
  }
}

export default async function AdminLoginPage({ searchParams }: AdminPageProps) {
  const session = await auth();
  if (session) {
    redirect("/admin/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;
  const code = resolvedSearchParams?.code;
  const message =
    error === "missing"
      ? "Password is required."
      : error === "credentials" && code === "missing_hash"
        ? "Admin access is not configured. Run pnpm setup-access and restart the dev server."
        : error === "credentials" && code === "rate_limited"
          ? "Too many attempts. Try again in about 15 minutes."
          : error === "credentials" && code === "invalid_password"
            ? "Password did not match. Please try again."
            : error === "credentials" && code === "missing_password"
              ? "Password is required."
              : error === "credentials"
                ? "Invalid credentials. Please try again."
                : error === "auth" && code === "MissingSecret"
                  ? "AUTH_SECRET is missing. Run pnpm setup-access and restart the dev server."
                  : error === "auth" && code === "InvalidCallbackUrl"
                    ? "Invalid callback URL. Check AUTH_URL and NEXT_PUBLIC_SITE_URL."
                    : error === "auth"
                      ? "Sign-in failed due to a configuration issue. Check server logs."
                      : error
                        ? "Unable to sign in. Please try again."
                        : null;
  return (
    <Container className="flex min-h-[calc(100dvh-4rem)] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-surface/70 p-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-text-dim">Admin</p>
        <h1 className="mt-3 text-2xl font-semibold text-text">Access panel</h1>
        <p className="mt-2 text-sm text-text-muted">
          Enter the shared password to manage shows and merch.
        </p>
        <form action={authenticate} className="mt-6 space-y-4">
          <PasswordField
            name="password"
            label="Password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
          {message ? (
            <p className="text-sm text-highlight" role="status" aria-live="polite">
              {message}
            </p>
          ) : null}
          <button type="submit" className="btn-primary w-full">
            Sign in
          </button>
        </form>
      </div>
    </Container>
  );
}
