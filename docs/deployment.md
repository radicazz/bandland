# Deployment + Scripts Guide

This document explains the production deployment flow and the helper scripts in
`/scripts`. It includes the fixes required for bcrypt hashes under Next.js env
loading (dotenv-expand).

## Quick production flow (Ubuntu/systemd)

1) Install dependencies and build:

```bash
cd /var/www/bandland
pnpm install
pnpm build
```

2) Create or update `.env.production`:

```bash
pnpm setup-access
```

3) Create/update the systemd unit and start the service:

```bash
sudo ./scripts/setup-systemd.sh bandland /var/www/bandland www-data
```

4) Restart and confirm:

```bash
sudo systemctl restart bandland
sudo systemctl status bandland --no-pager -l
```

## Why bcrypt hashes sometimes fail

Next.js uses dotenv-expand when loading `.env.production`. If the bcrypt hash is
stored as plain `$2a$12$...`, dotenv-expand treats `$2a`, `$12`, etc. as variable
references and strips them, resulting in invalid hashes (length 59/50).

The fix is to **escape `$` as `\$`** in `.env.production`, which the updated
`setup-access` script now does automatically.

## Scripts overview

### `pnpm setup-access`
Generates `.env.production` (for prod) or `.env.local` (for dev) with:
- `ADMIN_PASSWORD_HASH` (bcrypt, `$` escaped as `\$`)
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- Optional `CONTENT_DIR` for production

Use this whenever you need to rotate the admin password or bootstrap env files.

### `./scripts/setup-systemd.sh [service] [repo] [user] [envFile]`
Creates or updates `/etc/systemd/system/<service>.service` and starts it.

Key behaviors:
- Resolves repo path and npm path automatically.
- Writes a **systemd-specific env file** at `repo/.env.systemd` and points the
  unit at it via `EnvironmentFile=`.
- Removes `ADMIN_PASSWORD_HASH` from `.env.systemd` so Next.js reads the hash
  from `.env.production` (allowing dotenv-expand to process the escaped `\$`).

Example:

```bash
sudo ./scripts/setup-systemd.sh bandland /var/www/bandland www-data
```

### `./scripts/deploy.sh`
Pulls, installs, builds, and restarts the systemd service.

Environment variables:
- `SERVICE_NAME` (default `bandland`)
- `REPO_DIR` (defaults to script repo root)

Example:

```bash
SERVICE_NAME=bandland ./scripts/deploy.sh
```

### `node scripts/check-hash.mjs <password>`
Reads `ADMIN_PASSWORD_HASH` from `process.env` and verifies it. Prints warnings
if the hash length/prefix is invalid or double-escaped.

### `node scripts/verify-access.mjs`
Prompts for a password and verifies against:
- `process.env.ADMIN_PASSWORD_HASH`, or
- `.env.production`, `.env.local`, `.env`

This is useful to confirm the stored hash matches your password.

## Troubleshooting

### “Admin access is not configured”
The server does not see `ADMIN_PASSWORD_HASH` in its environment. Fix by:
1) Ensuring `.env.production` exists.
2) Re-running `setup-systemd.sh` so the unit points to the env file.
3) Restarting the service.

### “Password did not match”
Verify the hash using:

```bash
node scripts/verify-access.mjs
```

If the log shows a hash length not equal to 60, check that `$` is escaped as
`\$` in `.env.production`.
