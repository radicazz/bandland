import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";

type Authorize = (credentials: { password: string }, request: Request) => Promise<unknown>;

const captured = vi.hoisted(() => ({ authorize: undefined as unknown }));
vi.mock("next-auth", () => ({
  default: (config: { providers: { authorize: unknown }[] }) => {
    captured.authorize = config.providers[0]?.authorize;
    return { handlers: {} };
  },
  CredentialsSignin: class extends Error {
    code = "";
  },
}));
vi.mock("next-auth/providers/credentials", () => ({ default: (options: unknown) => options }));
vi.mock("@/lib/admin-login-limit", () => ({ getAdminLoginLimit: async () => "allowed" }));

await import("./auth");

const authorize = (password: string) =>
  (captured.authorize as Authorize)({ password }, new Request("https://bandland.example/admin"));
const hash = bcrypt.hashSync("throwaway-password", 4);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("admin authorize", () => {
  it("signs in when the stored hash kept its quotes and dotenv escapes", async () => {
    vi.stubEnv("ADMIN_PASSWORD_HASH", `'${hash.replaceAll("$", "\\$")}'`);
    await expect(authorize("throwaway-password")).resolves.toMatchObject({ id: "admin" });
    await expect(authorize("wrong")).rejects.toMatchObject({ code: "invalid_password" });
  });

  it("reports a malformed hash instead of a wrong password", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("ADMIN_PASSWORD_HASH", "not-a-hash");
    await expect(authorize("throwaway-password")).rejects.toMatchObject({ code: "invalid_hash" });
  });
});
