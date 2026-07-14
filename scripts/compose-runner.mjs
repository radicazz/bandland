#!/usr/bin/env node
import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import {
  isValidBcryptHash,
  loadEnvFile,
  normalizeEnvironment,
  normalizeHttpUrl,
} from "./lib/env.mjs";

const [engine, environmentInput, ...composeArgs] = process.argv.slice(2);

if (!engine || !environmentInput || composeArgs.length === 0) {
  console.error(
    "Usage: node scripts/compose-runner.mjs <docker|podman> <dev|prod> <compose arguments...>",
  );
  process.exit(1);
}

if (engine !== "docker" && engine !== "podman") {
  console.error("Container engine must be docker or podman.");
  process.exit(1);
}

try {
  const environment = normalizeEnvironment(environmentInput);
  const envFilePath = path.resolve(
    process.env.COMPOSE_ENV_FILE || (environment === "prod" ? ".env.production" : ".env.local"),
  );
  const canSkipEnv = composeArgs[0] === "down";
  let fileEnv = {};

  try {
    await fs.access(envFilePath, fsConstants.R_OK);
    fileEnv = await loadEnvFile(envFilePath);
  } catch (error) {
    if (!canSkipEnv) {
      const detail = error instanceof Error ? error.message : "file is not readable";
      throw new Error(
        `Unable to read ${envFilePath}: ${detail}. Run npm run setup-access first or set COMPOSE_ENV_FILE.`,
      );
    }
  }

  if (!canSkipEnv) {
    for (const key of ["ADMIN_PASSWORD_HASH", "AUTH_SECRET", "AUTH_URL", "NEXT_PUBLIC_SITE_URL"]) {
      if (!fileEnv[key]) {
        throw new Error(`${key} is missing from ${envFilePath}.`);
      }
    }

    if (!isValidBcryptHash(fileEnv.ADMIN_PASSWORD_HASH)) {
      throw new Error(`ADMIN_PASSWORD_HASH in ${envFilePath} is not a valid bcrypt hash.`);
    }

    normalizeHttpUrl(fileEnv.AUTH_URL, "AUTH_URL");
    normalizeHttpUrl(fileEnv.NEXT_PUBLIC_SITE_URL, "NEXT_PUBLIC_SITE_URL");
  }

  const command = engine === "docker" ? "docker" : "podman-compose";
  const args = engine === "docker" ? ["compose", ...composeArgs] : composeArgs;
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...fileEnv },
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(`Unable to start ${command}: ${error.message}`);
    process.exitCode = 1;
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`${command} stopped by signal ${signal}.`);
      process.exitCode = 1;
      return;
    }
    process.exitCode = code ?? 1;
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to start compose workflow.");
  process.exitCode = 1;
}
