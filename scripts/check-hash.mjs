#!/usr/bin/env node
import bcrypt from "bcryptjs";

console.log("=== Admin Password Diagnostics ===\n");

const hash = process.env.ADMIN_PASSWORD_HASH?.trim();

if (!hash) {
  console.log("❌ ADMIN_PASSWORD_HASH is not set in environment");
  process.exit(1);
}

console.log("Hash found in environment:");
console.log(`  Length: ${hash.length}`);
console.log(`  First 20 chars: ${hash.substring(0, 20)}`);
const hasBcryptPrefix =
  hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
console.log(`  Starts with bcrypt prefix: ${hasBcryptPrefix}`);
console.log(`  Contains backslash: ${hash.includes("\\")}`);
console.log(`  Contains double $$: ${hash.includes("$$")}`);

if (hash.length !== 60) {
  console.log(
    "\n⚠️  WARNING: bcrypt hashes should be exactly 60 characters long.",
  );
  if (!hasBcryptPrefix) {
    console.log(
      "   The bcrypt prefix looks missing. If you're using .env files,",
    );
    console.log(
      "   escape $ as \\$ (dotenv-expand will strip unescaped $).",
    );
  }
  if (hash.includes("$$")) {
    console.log(
      "   This looks double-escaped. Prefer using a systemd EnvironmentFile=,",
    );
    console.log(
      "   or escape $ as \\$ in .env files.",
    );
  }
}

if (hash.includes("\\")) {
  console.log("\n⚠️  WARNING: Hash contains backslashes - this will cause auth to fail!");
  console.log("   Expected: $2a$12$...");
  console.log(`   Got:      ${hash.substring(0, 30)}...`);
}

console.log("\n--- Testing password ---");
const testPassword = process.argv[2];

if (!testPassword) {
  console.log("Usage: node check-hash.mjs <password-to-test>");
  process.exit(0);
}

try {
  const isValid = await bcrypt.compare(testPassword, hash);
  if (isValid) {
    console.log(`✅ Password "${testPassword}" MATCHES the hash`);
  } else {
    console.log(`❌ Password "${testPassword}" does NOT match the hash`);
  }
} catch (error) {
  console.log(`❌ Error comparing: ${error.message}`);
}
