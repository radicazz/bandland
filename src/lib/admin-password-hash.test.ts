import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";

import { parseAdminPasswordHash } from "./admin-password-hash";

const hash = bcrypt.hashSync("throwaway-password", 4);
const escaped = hash.replaceAll("$", "\\$");

describe("parseAdminPasswordHash", () => {
  it.each([
    ["a clean hash", hash],
    ["surrounding whitespace", `  ${hash}\n`],
    ["single quotes", `'${hash}'`],
    ["double quotes", `"${hash}"`],
    ["dotenv escapes", escaped],
    ["quotes around dotenv escapes", `'${escaped}'`],
  ])("reads %s", (_, value) => {
    expect(parseAdminPasswordHash(value)).toBe(hash);
  });

  it.each([
    ["a plain password", "throwaway-password"],
    ["a truncated hash", hash.slice(0, -1)],
    // What dotenv expansion leaves behind when the dollars are not escaped.
    ["an expanded hash", hash.slice(7)],
    ["an unmatched quote", `'${hash}`],
  ])("rejects %s", (_, value) => {
    expect(parseAdminPasswordHash(value)).toBeNull();
  });
});
