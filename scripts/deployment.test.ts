// @vitest-environment node
import { execFile } from "node:child_process";
import { chmod, copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir, userInfo } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it } from "vitest";

import { loadEnvFile } from "./lib/env.mjs";
import { inspectModeForIdentity } from "./lib/permissions.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();
const temporaryRoots: string[] = [];

async function makeTemporaryRoot(name: string) {
  const root = path.join(
    tmpdir(),
    `bandland-${name}-${process.pid}-${Date.now()}-${temporaryRoots.length}`,
  );
  await mkdir(root, { recursive: true });
  temporaryRoots.push(root);
  return root;
}

async function writeExecutable(filePath: string, contents: string) {
  await writeFile(filePath, contents, { encoding: "utf8", mode: 0o755 });
  await chmod(filePath, 0o755);
}

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("deployment scripts", () => {
  it("creates a secure development env and usable bcrypt hash", async () => {
    const root = await makeTemporaryRoot("setup");
    const output = path.join(root, "nested", ".env.local");
    const mediaDir = path.join(root, "media");
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, "stale=true\n", { mode: 0o644 });
    await chmod(output, 0o644);

    await execFileAsync(process.execPath, [
      path.join(repoRoot, "scripts/setup-access.mjs"),
      "--env",
      "dev",
      "--site-url",
      "http://localhost:3000",
      "--password",
      "local-test-only",
      "--output",
      output,
      "--media-dir",
      mediaDir,
    ]);

    const outputStats = await stat(output);
    const values = await loadEnvFile(output);

    expect(outputStats.mode & 0o777).toBe(0o600);
    expect(await bcrypt.compare("local-test-only", values.ADMIN_PASSWORD_HASH)).toBe(true);
    expect(values.AUTH_URL).toBe("http://localhost:3000");
    expect((await stat(path.join(mediaDir, ".history"))).isDirectory()).toBe(true);
  });

  it("rejects invalid setup values before writing an env file", async () => {
    const root = await makeTemporaryRoot("invalid");
    const output = path.join(root, ".env.local");

    await expect(
      execFileAsync(process.execPath, [
        path.join(repoRoot, "scripts/setup-access.mjs"),
        "--env",
        "staging",
        "--site-url",
        "not-a-url",
        "--password",
        "test-only",
        "--output",
        output,
      ]),
    ).rejects.toMatchObject({ code: 1 });

    await expect(stat(output)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("renders a systemd-safe env with a normalized hash and port", async () => {
    const root = await makeTemporaryRoot("systemd-env");
    const source = path.join(root, ".env.production");
    const output = path.join(root, ".env.systemd");
    const hash = await bcrypt.hash("systemd-test", 4);

    await writeFile(
      source,
      `ADMIN_PASSWORD_HASH='${hash.replaceAll("$", "\\$")}'\nAPP_PORT=3100\nAUTH_URL=https://bandland.example\n`,
    );
    await execFileAsync(process.execPath, [
      path.join(repoRoot, "scripts/render-systemd-env.mjs"),
      source,
      output,
    ]);

    const rendered = await readFile(output, "utf8");
    expect(rendered).toContain(`ADMIN_PASSWORD_HASH="${hash}"`);
    expect(rendered).toContain('PORT="3100"');
    expect(rendered).not.toContain("\\$");
    expect((await stat(output)).mode & 0o777).toBe(0o600);
  });

  it("evaluates directory permissions for the configured service identity", () => {
    const stats = { uid: 1001, gid: 2001, mode: 0o40750 };

    expect(inspectModeForIdentity(stats, { uid: 1001, groups: new Set([2001]) })).toEqual({
      readable: true,
      writable: true,
      executable: true,
    });
    expect(inspectModeForIdentity(stats, { uid: 1002, groups: new Set([2001]) })).toEqual({
      readable: true,
      writable: false,
      executable: true,
    });
    expect(inspectModeForIdentity(stats, { uid: 1003, groups: new Set([2002]) })).toEqual({
      readable: false,
      writable: false,
      executable: false,
    });
  });

  it("passes preflight against storage owned by the configured service user", async () => {
    const root = await makeTemporaryRoot("preflight");
    const binDir = path.join(root, "bin");
    const contentDir = path.join(root, "content");
    const mediaDir = path.join(root, "media");
    const rateLimitDir = path.join(root, "auth-rate-limit");
    const envFile = path.join(root, ".env.production");
    const logFile = path.join(root, "preflight.log");
    const hash = await bcrypt.hash("preflight-test", 4);
    await mkdir(binDir);
    await mkdir(path.join(contentDir, ".history"), { recursive: true });
    await mkdir(path.join(mediaDir, ".history"), { recursive: true });
    await mkdir(rateLimitDir);
    await writeFile(path.join(root, "package.json"), "{}\n");
    await copyFile(path.join(repoRoot, "content/shows.json"), path.join(contentDir, "shows.json"));
    await copyFile(path.join(repoRoot, "content/merch.json"), path.join(contentDir, "merch.json"));
    await writeFile(path.join(contentDir, "admin-audit.json"), "[]\n");
    await writeFile(
      envFile,
      `ADMIN_PASSWORD_HASH='${hash.replaceAll("$", "\\$")}'\nAUTH_SECRET=test-secret\nAUTH_URL=https://bandland.example\nNEXT_PUBLIC_SITE_URL=https://bandland.example\nCONTENT_DIR=${contentDir}\nMEDIA_DIR=${mediaDir}\nMEDIA_HISTORY_DIR=${path.join(mediaDir, ".history")}\nAUTH_RATE_LIMIT_DIR=${rateLimitDir}\n`,
      { mode: 0o600 },
    );
    await writeExecutable(
      path.join(binDir, "systemctl"),
      '#!/usr/bin/env bash\nprintf "%s\\n" "$*" > "$FAKE_LOG"\nprintf "bandland.service enabled\\n"\n',
    );

    await execFileAsync(
      process.execPath,
      [
        path.join(repoRoot, "scripts/preflight-deploy.mjs"),
        "--repo-dir",
        root,
        "--service-name",
        "bandland",
        "--service-user",
        userInfo().username,
        "--env-file",
        envFile,
      ],
      {
        env: {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH}`,
          FAKE_LOG: logFile,
        },
      },
    );

    expect(await readFile(logFile, "utf8")).toContain("bandland.service");
  });

  it("passes normalized secrets to compose without exposing dotenv escapes", async () => {
    const root = await makeTemporaryRoot("compose");
    const binDir = path.join(root, "bin");
    const envFile = path.join(root, ".env.production");
    const logFile = path.join(root, "compose.log");
    const hash = await bcrypt.hash("compose-test", 4);
    await mkdir(binDir);
    await writeFile(
      envFile,
      `ADMIN_PASSWORD_HASH='${hash.replaceAll("$", "\\$")}'\nAUTH_SECRET=test-secret\nAUTH_URL=https://bandland.example\nNEXT_PUBLIC_SITE_URL=https://bandland.example\n`,
      { mode: 0o600 },
    );
    await writeExecutable(
      path.join(binDir, "docker"),
      '#!/usr/bin/env bash\nprintf "%s\\n%s\\n" "$*" "$ADMIN_PASSWORD_HASH" > "$FAKE_LOG"\n',
    );

    await execFileAsync(
      process.execPath,
      [path.join(repoRoot, "scripts/compose-runner.mjs"), "docker", "prod", "config"],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH}`,
          COMPOSE_ENV_FILE: envFile,
          FAKE_LOG: logFile,
        },
      },
    );

    const [args, passedHash] = (await readFile(logFile, "utf8")).trim().split("\n");
    expect(args).toBe("compose config");
    expect(passedHash).toBe(hash);
  });

  it("runs deploy steps in order and forwards the service user", async () => {
    const root = await makeTemporaryRoot("deploy");
    const binDir = path.join(root, "bin");
    const logFile = path.join(root, "deploy.log");
    await mkdir(binDir);
    await mkdir(path.join(root, "scripts"));
    await writeFile(path.join(root, "package.json"), '{"packageManager":"npm@11.12.1"}\n');
    await writeFile(path.join(root, "package-lock.json"), "{}\n");
    await writeFile(path.join(root, ".env.production"), "APP_PORT=3100\n");

    await writeExecutable(
      path.join(binDir, "git"),
      '#!/usr/bin/env bash\nprintf "git %s\\n" "$*" >> "$FAKE_LOG"\n',
    );
    await writeExecutable(
      path.join(binDir, "node"),
      '#!/usr/bin/env bash\nprintf "node %s\\n" "$*" >> "$FAKE_LOG"\n',
    );
    await writeExecutable(
      path.join(binDir, "npm"),
      '#!/usr/bin/env bash\nprintf "npm %s\\n" "$*" >> "$FAKE_LOG"\n',
    );
    await writeExecutable(
      path.join(binDir, "systemctl"),
      '#!/usr/bin/env bash\nprintf "systemctl %s\\n" "$*" >> "$FAKE_LOG"\nif [ "$1" = "list-unit-files" ]; then printf "bandland.service enabled\\n"; fi\n',
    );
    await writeExecutable(
      path.join(binDir, "sudo"),
      '#!/usr/bin/env bash\nprintf "sudo %s\\n" "$*" >> "$FAKE_LOG"\nexec "$@"\n',
    );

    await execFileAsync("bash", [path.join(repoRoot, "scripts/deploy.sh")], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        REPO_DIR: root,
        SERVICE_USER: "bandland-app",
        FAKE_LOG: logFile,
      },
    });

    const log = await readFile(logFile, "utf8");
    expect(log).toContain("git status --short --untracked-files=no");
    expect(log).toContain("git pull --ff-only");
    expect(log).toContain("--service-user bandland-app");
    expect(log).toContain("npm ci");
    expect(log).toContain("npm run build");
    expect(log).toContain("systemctl restart bandland");
    expect(log).toContain("http://127.0.0.1:3100/api/health");
  });
});
