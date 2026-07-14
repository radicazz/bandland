#!/usr/bin/env node
import path from "node:path";

import { loadEnvFile, normalizePort, writePrivateFile } from "./lib/env.mjs";

const [sourceArg, outputArg] = process.argv.slice(2);

if (!sourceArg || !outputArg) {
  console.error("Usage: node scripts/render-systemd-env.mjs <source-env> <output-env>");
  process.exit(1);
}

function quoteSystemdValue(value) {
  if (value.includes("\n") || value.includes("\r")) {
    throw new Error("Environment values must not contain newlines.");
  }

  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

try {
  const values = await loadEnvFile(path.resolve(sourceArg));

  if (values.APP_PORT) {
    values.PORT = normalizePort(values.APP_PORT);
  }

  const contents = `${Object.entries(values)
    .map(([key, value]) => {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        throw new Error(`Invalid environment variable name: ${key}`);
      }
      return `${key}=${quoteSystemdValue(value)}`;
    })
    .join("\n")}\n`;

  const outputPath = path.resolve(outputArg);
  await writePrivateFile(outputPath, contents);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to render systemd env file.");
  process.exitCode = 1;
}
