import { randomBytes } from "node:crypto";
import { chmod, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export function normalizeEnvValue(value) {
  let normalized = value.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  return normalized.replaceAll("\\$", "$");
}

export function parseEnvContents(contents) {
  const values = {};

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    if (!key) {
      continue;
    }

    values[key] = normalizeEnvValue(line.slice(equalsIndex + 1));
  }

  return values;
}

export async function loadEnvFile(envFilePath) {
  return parseEnvContents(await readFile(envFilePath, "utf8"));
}

export async function writePrivateFile(filePath, contents) {
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`,
  );

  try {
    await writeFile(temporaryPath, contents, { encoding: "utf8", mode: 0o600, flag: "wx" });
    await chmod(temporaryPath, 0o600);
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export function normalizeEnvironment(value) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "dev" || normalized === "development") {
    return "dev";
  }

  if (normalized === "prod" || normalized === "production") {
    return "prod";
  }

  throw new Error("Environment must be dev, development, prod, or production.");
}

export function normalizeHttpUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid absolute HTTP(S) URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${label} must use http:// or https://.`);
  }

  if (parsed.username || parsed.password) {
    throw new Error(`${label} must not contain embedded credentials.`);
  }

  return value;
}

export function normalizePort(value, label = "App port") {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be an integer between 1 and 65535.`);
  }

  const port = Number.parseInt(value, 10);
  if (port < 1 || port > 65_535) {
    throw new Error(`${label} must be an integer between 1 and 65535.`);
  }

  return String(port);
}

export function isValidBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}
