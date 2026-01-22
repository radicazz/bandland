#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import readline from "node:readline/promises";
import bcrypt from "bcryptjs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const run = async () => {
  const envInput = await rl.question(
    "Environment (dev/prod, default dev): ",
  );
  const environment = envInput.trim().toLowerCase() || "dev";
  const isProduction = environment === "prod" || environment === "production";

  const siteUrlInput = await rl.question(
    `Site URL (default ${isProduction ? "https://example.com" : "http://localhost:3000"}): `,
  );
  const siteUrl = siteUrlInput.trim() || (isProduction ? "https://example.com" : "http://localhost:3000");

  const passwordInput = await rl.question("Admin password: ");
  const password = passwordInput.trim();

  if (!password) {
    console.error("Password is required.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const authSecret = randomBytes(32).toString("base64");
  
  // For .env files, wrap the hash in quotes to prevent shell interpretation
  const finalPasswordHash = isProduction 
    ? `"${passwordHash}"` 
    : passwordHash.replaceAll("$", "\\$");

  let contentDirSection = "";
  if (isProduction) {
    const contentDirInput = await rl.question(
      "Content directory (default /var/lib/bandland/content): ",
    );
    const contentDir = contentDirInput.trim() || "/var/lib/bandland/content";
    contentDirSection = `
# Content storage outside repo
CONTENT_DIR=${contentDir}
`;
  }

  const envContents = `# Admin Panel
# Generate hash: npx bcrypt-cli hash "your-password" 12
ADMIN_PASSWORD_HASH=${finalPasswordHash}
AUTH_SECRET='${authSecret}'
AUTH_URL=${siteUrl}

# Used for generating absolute URLs in metadata/OG.
# In production, set this to your canonical site URL (e.g. https://bandland.com).
NEXT_PUBLIC_SITE_URL=${siteUrl}${contentDirSection}
`;

  // Use .env.production for production, .env.local for dev
  const envFilePath = isProduction
    ? resolve(process.cwd(), ".env.production")
    : resolve(process.cwd(), ".env.local");

  await writeFile(envFilePath, envContents, "utf8");
  console.log(`✓ Wrote ${envFilePath}`);
  
  if (isProduction) {
    console.log("\nProduction environment configured.");
    console.log("Next steps:");
    console.log("  1. Create content directory:");
    const contentDir = contentDirSection.trim() ? contentDirSection.split("=")[1] : "/var/lib/bandland/content";
    console.log(`     sudo mkdir -p ${contentDir}`);
    console.log(`     sudo chown -R www-data:www-data ${contentDir}`);
    console.log("  2. Rebuild the app: npm run build");
    console.log("  3. Restart the service: sudo systemctl restart bandland");
  } else {
    console.log("\nDevelopment environment configured.");
    console.log("Start the dev server: npm run dev");
  }
};

try {
  await run();
} finally {
  rl.close();
}
