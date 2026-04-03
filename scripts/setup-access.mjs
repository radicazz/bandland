#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path, { resolve } from "node:path";
import readline from "node:readline/promises";
import bcrypt from "bcryptjs";

function parseArgs(argv) {
  const args = {
    environment: undefined,
    siteUrl: undefined,
    contentDir: undefined,
    rateLimitDir: undefined,
    password: undefined,
    output: undefined,
    appPort: undefined,
    healthcheckUrl: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help" || arg === "-h") {
      console.log(`Usage: npm run setup-access -- [options]

Options:
  --env <dev|prod>             Target environment
  --site-url <url>             Site URL for AUTH_URL and NEXT_PUBLIC_SITE_URL
  --content-dir <path>         Persistent content directory for production
  --rate-limit-dir <path>      Persistent admin rate-limit directory for production
  --password <value>           Admin password to hash
  --output <path>              Output env file path
  --app-port <port>            Optional APP_PORT for Next.js
  --healthcheck-url <url>      Optional DEPLOY_HEALTHCHECK_URL override
  -h, --help                   Show this help text
`);
      process.exit(0);
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }

    switch (arg) {
      case "--env":
        args.environment = next;
        break;
      case "--site-url":
        args.siteUrl = next;
        break;
      case "--content-dir":
        args.contentDir = next;
        break;
      case "--rate-limit-dir":
        args.rateLimitDir = next;
        break;
      case "--password":
        args.password = next;
        break;
      case "--output":
        args.output = next;
        break;
      case "--app-port":
        args.appPort = next;
        break;
      case "--healthcheck-url":
        args.healthcheckUrl = next;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }

    index += 1;
  }

  return args;
}

const options = parseArgs(process.argv.slice(2));
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptIfMissing(currentValue, prompt) {
  if (typeof currentValue === "string" && currentValue.trim().length > 0) {
    return currentValue.trim();
  }

  const answer = await rl.question(prompt);
  return answer.trim();
}

const run = async () => {
  const envInput =
    (await promptIfMissing(options.environment, "Environment (dev/prod, default dev): ")) ||
    "dev";
  const environment = envInput.toLowerCase();
  const isProduction = environment === "prod" || environment === "production";

  const siteUrl =
    (await promptIfMissing(
      options.siteUrl,
      `Site URL (default ${isProduction ? "https://example.com" : "http://localhost:3000"}): `,
    )) || (isProduction ? "https://example.com" : "http://localhost:3000");

  const password = await promptIfMissing(options.password, "Admin password: ");

  if (!password) {
    console.error("Password is required.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const authSecret = randomBytes(32).toString("base64");

  // Escape $ to prevent dotenv-expand from stripping bcrypt prefixes.
  const finalPasswordHash = passwordHash.replaceAll("$", "\\$");

  let contentDirSection = "";
  let rateLimitDirSection = "";
  let appPortSection = "";
  let healthcheckSection = "";
  let resolvedContentDir = "/var/lib/bandland/content";
  let resolvedRateLimitDir = path.join(path.dirname(resolvedContentDir), "auth-rate-limit");

  const appPort = options.appPort?.trim();
  if (appPort) {
    appPortSection = `
APP_PORT=${appPort}
`;
  }

  const healthcheckUrl = options.healthcheckUrl?.trim();
  if (healthcheckUrl) {
    healthcheckSection = `
DEPLOY_HEALTHCHECK_URL=${healthcheckUrl}
`;
  }

  if (isProduction) {
    resolvedContentDir =
      (await promptIfMissing(
        options.contentDir,
        "Content directory (default /var/lib/bandland/content): ",
      )) || "/var/lib/bandland/content";
    resolvedRateLimitDir =
      options.rateLimitDir?.trim() ||
      path.join(path.dirname(resolvedContentDir), "auth-rate-limit");

    contentDirSection = `
# Content storage outside repo
CONTENT_DIR=${resolvedContentDir}
`;
    rateLimitDirSection = `
# Persist admin rate limiting outside the app process
AUTH_RATE_LIMIT_DIR=${resolvedRateLimitDir}
`;
  }

  const envContents = `# Admin Panel
# Generate hash: npx bcrypt-cli hash "your-password" 12
ADMIN_PASSWORD_HASH='${finalPasswordHash}'
AUTH_SECRET='${authSecret}'
AUTH_URL=${siteUrl}

# Used for generating absolute URLs in metadata/OG.
# In production, set this to your canonical site URL (e.g. https://bandland.com).
NEXT_PUBLIC_SITE_URL=${siteUrl}${contentDirSection}${rateLimitDirSection}${appPortSection}${healthcheckSection}
`;

  const envFilePath =
    options.output?.trim() ||
    (isProduction ? resolve(process.cwd(), ".env.production") : resolve(process.cwd(), ".env.local"));

  await writeFile(envFilePath, envContents, "utf8");
  console.log(`✓ Wrote ${envFilePath}`);

  if (isProduction) {
    console.log("\nProduction environment configured.");
    console.log("Next steps:");
    console.log("  1. Create persistent directories:");
    console.log(`     sudo mkdir -p ${resolvedContentDir}`);
    console.log(`     sudo mkdir -p ${resolvedContentDir}/.history`);
    console.log(`     sudo mkdir -p ${resolvedRateLimitDir}`);
    console.log(
      `     sudo chown -R www-data:www-data ${resolvedContentDir} ${resolvedRateLimitDir}`,
    );
    console.log("  2. Run bootstrap if this is a live VPS setup:");
    console.log("     sudo npm run bootstrap:vps");
    console.log("  3. Run the deploy flow:");
    console.log("     ./scripts/deploy.sh");
  } else {
    console.log("\nDevelopment environment configured.");
    console.log("Start the dev server: npm run dev");
  }
};

try {
  await run();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
} finally {
  rl.close();
}
