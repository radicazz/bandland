#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path, { resolve } from "node:path";
import readline from "node:readline/promises";
import bcrypt from "bcryptjs";

import {
  normalizeEnvironment,
  normalizeHttpUrl,
  normalizePort,
  writePrivateFile,
} from "./lib/env.mjs";

function parseArgs(argv) {
  const args = {
    environment: undefined,
    siteUrl: undefined,
    contentDir: undefined,
    mediaDir: undefined,
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
  --media-dir <path>           Persistent uploaded media directory
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
      case "--media-dir":
        args.mediaDir = next;
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
    (await promptIfMissing(options.environment, "Environment (dev/prod, default dev): ")) || "dev";
  const environment = normalizeEnvironment(envInput);
  const isProduction = environment === "prod";

  const siteUrlInput =
    (await promptIfMissing(
      options.siteUrl,
      `Site URL (default ${isProduction ? "https://example.com" : "http://localhost:3000"}): `,
    )) || (isProduction ? "https://example.com" : "http://localhost:3000");
  const siteUrl = normalizeHttpUrl(siteUrlInput, "Site URL");

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
  let mediaDirSection = "";
  let appPortSection = "";
  let healthcheckSection = "";
  let resolvedContentDir = "/var/lib/bandland/content";
  let resolvedRateLimitDir = path.join(path.dirname(resolvedContentDir), "auth-rate-limit");
  let resolvedMediaDir = path.join(process.cwd(), "content", "media");

  const appPortInput = options.appPort?.trim();
  const appPort = appPortInput ? normalizePort(appPortInput) : undefined;
  if (appPort) {
    appPortSection = `
APP_PORT=${appPort}
`;
  }

  const healthcheckUrlInput = options.healthcheckUrl?.trim();
  const healthcheckUrl = healthcheckUrlInput
    ? normalizeHttpUrl(healthcheckUrlInput, "Health-check URL")
    : undefined;
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
    resolvedMediaDir =
      options.mediaDir?.trim() || path.join(path.dirname(resolvedContentDir), "media");

    contentDirSection = `
# Content storage outside repo
CONTENT_DIR=${resolvedContentDir}
`;
    rateLimitDirSection = `
# Persist admin rate limiting outside the app process
AUTH_RATE_LIMIT_DIR=${resolvedRateLimitDir}
`;
  } else if (options.mediaDir?.trim()) {
    resolvedMediaDir = options.mediaDir.trim();
  }

  mediaDirSection = `
# Uploaded photo storage
MEDIA_DIR=${resolvedMediaDir}
MEDIA_HISTORY_DIR=${path.join(resolvedMediaDir, ".history")}
`;

  const envContents = `# Admin Panel
# Regenerate safely with: npm run setup-access
ADMIN_PASSWORD_HASH='${finalPasswordHash}'
AUTH_SECRET='${authSecret}'
AUTH_URL=${siteUrl}

# Used for generating absolute URLs in metadata/OG.
# In production, set this to your canonical site URL (e.g. https://bandland.com).
NEXT_PUBLIC_SITE_URL=${siteUrl}${contentDirSection}${mediaDirSection}${rateLimitDirSection}${appPortSection}${healthcheckSection}
`;

  const envFilePath =
    options.output?.trim() ||
    (isProduction
      ? resolve(process.cwd(), ".env.production")
      : resolve(process.cwd(), ".env.local"));

  await mkdir(path.dirname(envFilePath), { recursive: true });
  await writePrivateFile(envFilePath, envContents);
  console.log(`✓ Wrote ${envFilePath}`);

  if (!isProduction) {
    await mkdir(path.join(resolvedMediaDir, ".history"), { recursive: true });
    console.log(`✓ Prepared local media storage at ${resolvedMediaDir}`);
  }

  if (isProduction) {
    console.log("\nProduction environment configured.");
    console.log("For a systemd VPS:");
    console.log("  1. npm run bootstrap:vps");
    console.log("  2. ./scripts/deploy.sh");
    console.log("For containers:");
    console.log("  npm run docker:up  # or npm run podman:up");
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
