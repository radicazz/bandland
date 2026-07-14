#!/usr/bin/env node
import { resolve } from "node:path";
import readline from "node:readline/promises";
import bcrypt from "bcryptjs";

import { loadEnvFile } from "./lib/env.mjs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const parseHashFromFile = async (envPath) => {
  try {
    const values = await loadEnvFile(envPath);
    return values.ADMIN_PASSWORD_HASH?.trim() || null;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const code = error.code;
      if (code === "ENOENT") {
        return null;
      }
    }
    throw error;
  }

  return null;
};

const loadPasswordHash = async () => {
  const fromEnv = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (fromEnv) {
    return { hash: fromEnv, source: "process.env" };
  }

  const envCandidates = [".env.production", ".env.local", ".env"];
  for (const filename of envCandidates) {
    const envPath = resolve(process.cwd(), filename);
    const hash = await parseHashFromFile(envPath);
    if (hash) {
      return { hash, source: envPath };
    }
  }

  return null;
};

const run = async () => {
  const passwordInput = await rl.question("Password to verify: ");
  const password = passwordInput.trim();
  if (!password) {
    console.error("Password is required.");
    process.exitCode = 1;
    return;
  }

  const result = await loadPasswordHash();
  if (!result) {
    console.error("ADMIN_PASSWORD_HASH not found. Run npm run setup-access to generate env file.");
    process.exitCode = 1;
    return;
  }

  const hasBcryptPrefix =
    result.hash.startsWith("$2a$") ||
    result.hash.startsWith("$2b$") ||
    result.hash.startsWith("$2y$");
  if (result.hash.length !== 60 || !hasBcryptPrefix) {
    console.error(`Warning: ADMIN_PASSWORD_HASH looks unusual (length ${result.hash.length}).`);
    if (result.hash.includes("$$")) {
      console.error("It contains $$ which often means the hash was double-escaped for systemd.");
    }
  }

  const matches = await bcrypt.compare(password, result.hash);
  if (matches) {
    console.log(`Password matches ADMIN_PASSWORD_HASH (${result.source}).`);
  } else {
    console.error(`Password does not match ADMIN_PASSWORD_HASH (${result.source}).`);
    process.exitCode = 1;
  }
};

try {
  await run();
} finally {
  rl.close();
}
