#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import readline from "node:readline";

import bcrypt from "bcryptjs";

function readHiddenPassword() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdout.write("Admin password: ");

    const cleanup = () => {
      process.stdin.off("keypress", onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };

    const onKeypress = (text, key) => {
      if (key?.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Cancelled."));
      } else if (key?.name === "return" || key?.name === "enter") {
        cleanup();
        resolve(value);
      } else if (key?.name === "backspace") {
        value = value.slice(0, -1);
      } else if (!key?.ctrl && !key?.meta && text) {
        value += text;
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}

try {
  const password = await readHiddenPassword();
  if (password.length < 12) throw new Error("Use an admin password with at least 12 characters.");

  const hash = await bcrypt.hash(password, 12);
  const secret = randomBytes(32).toString("base64url");
  console.log("Copy these values into Vercel Environment Variables:");
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`AUTH_SECRET=${secret}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to generate credentials.");
  process.exitCode = 1;
}
