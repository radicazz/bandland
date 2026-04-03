# Deployment + Scripts Guide

This document focuses on the repo’s primary production path: an existing Ubuntu
/ VPS site managed with `systemd`, persistent JSON content, and the built-in
admin panel.

## Recommended live-site flow

### First-time bootstrap

1. Generate or rotate production env values:

```bash
npm run setup-access -- --env prod --site-url https://your-site.example
```

2. Create persistent directories, seed content only when missing, and wire up
the service:

```bash
sudo npm run bootstrap:vps
```

3. Run the full deploy flow:

```bash
./scripts/deploy.sh
```

### Routine deploy

For a site that is already configured:

```bash
./scripts/deploy.sh
```

The deploy script now:
- pulls the latest code
- runs a production preflight
- installs dependencies
- builds the app
- restarts the `systemd` service
- verifies `GET /api/health` before reporting success

## Why bcrypt hashes sometimes fail

Next.js uses dotenv-expand when loading `.env.production`. If the bcrypt hash is
stored as plain `$2a$12$...`, dotenv-expand treats `$2a`, `$12`, etc. as variable
references and strips them, resulting in invalid hashes (length 59/50).

The fix is to **escape `$` as `\$`** in `.env.production`, which the updated
`setup-access` script now does automatically.

## Scripts overview

### `npm run setup-access -- [options]`
Generates `.env.production` (for prod) or `.env.local` (for dev) with:
- `ADMIN_PASSWORD_HASH` (bcrypt, `$` escaped as `\$`)
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- Optional `CONTENT_DIR`, `AUTH_RATE_LIMIT_DIR`, `APP_PORT`, and `DEPLOY_HEALTHCHECK_URL`

Supported flags:
- `--env <dev|prod>`
- `--site-url <url>`
- `--content-dir <path>`
- `--rate-limit-dir <path>`
- `--password <value>`
- `--output <path>`
- `--app-port <port>`
- `--healthcheck-url <url>`

Use this for first-time setup, password rotation, or scripted env generation.

### `npm run bootstrap:vps`
Creates the recommended persistent directory layout for an existing live site:
- content directory
- backup history directory
- persistent rate-limit directory

It seeds `shows.json`, `merch.json`, and `admin-audit.json` only when those
destination files are missing. Existing data is preserved unless `FORCE=1`.

Defaults:
- service name: `bandland`
- repo dir: current working directory
- service user: `www-data`
- data root: `/var/lib/<service>`
- `BOOTSTRAP_USE_SUDO=auto` picks `sudo` only when the target paths, service
  user, or `setup-systemd` step require it

Examples:

```bash
sudo npm run bootstrap:vps
```

```bash
sudo FORCE=1 RUN_SETUP_SYSTEMD=0 npm run bootstrap:vps -- bandland /var/www/bandland www-data /var/lib/bandland
```

```bash
BOOTSTRAP_USE_SUDO=never RUN_SETUP_SYSTEMD=0 SERVICE_USER=$USER npm run bootstrap:vps -- bandland "$PWD" "$USER" /tmp/bandland
```

### `./scripts/setup-systemd.sh [service] [repo] [user] [envFile]`
Creates or updates `/etc/systemd/system/<service>.service` and starts it.

Key behaviors:
- Resolves repo path and npm path automatically.
- Writes a **systemd-specific env file** at `repo/.env.systemd` and points the
  unit at it via `EnvironmentFile=`.
- Removes `ADMIN_PASSWORD_HASH` from `.env.systemd` so Next.js reads the hash
  from `.env.production` (allowing dotenv-expand to process the escaped `\$`).
- Maps optional `APP_PORT` to `PORT` inside `.env.systemd` so `next start`
  listens on the expected port.
- Passes through `AUTH_RATE_LIMIT_DIR` so login throttling can survive process
  restarts when pointed at persistent storage.

Example:

```bash
sudo ./scripts/setup-systemd.sh bandland /var/www/bandland www-data
```

### `./scripts/deploy.sh`
Pulls, preflights, installs, builds, restarts, and health-checks the service.

Environment variables:
- `SERVICE_NAME` (default `bandland`)
- `REPO_DIR` (defaults to script repo root)
- `ENV_FILE` (optional env file override)
- `HEALTHCHECK_URL` (optional deploy-time override)

Example:

```bash
SERVICE_NAME=bandland ./scripts/deploy.sh
```

### `npm run deploy:preflight -- --repo-dir <path> --service-name <name> --env-file <path>`
Runs the same deploy preflight used by `./scripts/deploy.sh`.

Checks:
- required env values
- content and history paths
- optional persistent rate-limit path
- `shows.json`, `merch.json`, and `admin-audit.json` existence + JSON shape
- presence of the target `systemd` unit

### `node scripts/check-hash.mjs <password>`
Reads `ADMIN_PASSWORD_HASH` from `process.env` and verifies it. Prints warnings
if the hash length/prefix is invalid or double-escaped.

### `node scripts/verify-access.mjs`
Prompts for a password and verifies against:
- `process.env.ADMIN_PASSWORD_HASH`, or
- `.env.production`, `.env.local`, `.env`

This is useful to confirm the stored hash matches your password.

## Existing-site notes

- Persistent live content should use `CONTENT_DIR`, not the repo checkout.
- The admin dashboard at `/admin/dashboard` now shows:
  - storage mode
  - configured content, history, and rate-limit paths
  - latest backup timestamp
  - runtime config warnings
  - content-file validity status
- The public health endpoint is `GET /api/health`.

## Troubleshooting

### “Admin access is not configured”
The server does not see `ADMIN_PASSWORD_HASH` in its environment. Fix by:
1) Ensuring `.env.production` exists.
2) Re-running `setup-systemd.sh` so the unit points to the env file.
3) Restarting the service.

### Deploy preflight fails
Run:

```bash
npm run deploy:preflight -- --repo-dir /var/www/bandland --service-name bandland --env-file /var/www/bandland/.env.production
```

Fix the reported env, path, or JSON issue before restarting the service.

### Rate limiting resets after every restart
Set `AUTH_RATE_LIMIT_DIR` to a persistent directory such as
`/var/lib/bandland/auth-rate-limit`, make sure the service user can write to it,
and restart the app.

### Existing content would be overwritten during bootstrap
Bootstrap preserves existing files by default. If you intentionally want to
replace the destination JSON files, rerun with:

```bash
sudo FORCE=1 npm run bootstrap:vps
```

### “Password did not match”
Verify the hash using:

```bash
node scripts/verify-access.mjs
```

If the log shows a hash length not equal to 60, check that `$` is escaped as
`\$` in `.env.production`.
