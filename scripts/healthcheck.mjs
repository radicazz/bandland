#!/usr/bin/env node
const [url, attemptsArg, delayArg] = process.argv.slice(2);

if (!url) {
  console.error("Usage: node scripts/healthcheck.mjs <url> [attempts] [delayMs]");
  process.exit(1);
}

const attempts = Number.parseInt(attemptsArg ?? "20", 10);
const delayMs = Number.parseInt(delayArg ?? "1500", 10);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let lastError = "Unknown error";

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
    });

    const body = await response.text();
    if (response.ok) {
      console.log(`Health check passed (${response.status}) on attempt ${attempt}.`);
      if (body.trim()) {
        console.log(body);
      }
      process.exit(0);
    }

    lastError = `HTTP ${response.status}: ${body}`;
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Unknown fetch error";
  }

  if (attempt < attempts) {
    await wait(delayMs);
  }
}

console.error(`Health check failed for ${url}: ${lastError}`);
process.exit(1);
