#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import readline from "node:readline/promises";
import bcrypt from "bcryptjs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const run = async () => {
  const siteUrlInput = await rl.question(
    "Site URL (default http://localhost:3000): ",
  );
  const siteUrl = siteUrlInput.trim() || "http://localhost:3000";

  const passwordInput = await rl.question("Admin password: ");
  const password = passwordInput.trim();

  if (!password) {
    console.error("Password is required.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const authSecret = randomBytes(32).toString("base64");
  const escapedPasswordHash = passwordHash.replaceAll("$", "\\$");

  const envContents = `# Admin Panel
# Generate hash: npx bcrypt-cli hash "your-password" 12
ADMIN_PASSWORD_HASH=${escapedPasswordHash}
AUTH_SECRET='${authSecret}'
AUTH_URL=${siteUrl}

# Used for generating absolute URLs in metadata/OG.
# In production, set this to your canonical site URL (e.g. https://bandland.com).
NEXT_PUBLIC_SITE_URL=${siteUrl}
`;

  const envLocalPath = resolve(process.cwd(), ".env.local");
  const envPath = resolve(process.cwd(), ".env");

  const targets = [envLocalPath];
  try {
    await access(envPath);
    targets.push(envPath);
  } catch {
    // .env is optional; prefer .env.local for Next.js
  }

  await Promise.all(targets.map((target) => writeFile(target, envContents, "utf8")));
  for (const target of targets) {
    console.log(`Wrote ${target}`);
  }
};

try {
  await run();
} finally {
  rl.close();
}
