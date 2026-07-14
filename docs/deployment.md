# Deployment + Scripts Guide

This document covers the primary Ubuntu/VPS `systemd` path plus the supported
Docker Compose and Podman Compose paths. All production options keep JSON,
uploaded media, history, and login rate limits outside the disposable app
runtime.

## Recommended live-site flow

### First-time bootstrap

1. Generate or rotate production env values:

```bash
npm run setup-access -- --env prod --site-url https://your-site.example
```

2. Create persistent directories, seed content only when missing, and wire up
   the service:

```bash
npm run bootstrap:vps
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

Run deploy as the repository owner. The script uses `sudo` only for service
management when needed. Its preflight checks storage permissions as the
configured service user (`www-data` by default), not as the human deploy user.

## Why bcrypt hashes sometimes fail

Next.js uses dotenv-expand when loading `.env.production`. If the bcrypt hash is
stored as plain `$2a$12$...`, dotenv-expand treats `$2a`, `$12`, etc. as variable
references and strips them, resulting in invalid hashes (length 59/50).

The fix is to **escape `$` as `\$`** in Next.js dotenv files, which
`setup-access` does automatically. The systemd and Compose helpers normalize
that value before passing it directly to a process; this also prevents literal
backslashes from reaching bcrypt.

## Scripts overview

### `npm run setup-access -- [options]`

Generates `.env.production` (for prod) or `.env.local` (for dev) with:

- `ADMIN_PASSWORD_HASH` (bcrypt, `$` escaped as `\$`)
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- Production `CONTENT_DIR` and `AUTH_RATE_LIMIT_DIR`
- Optional `APP_PORT` and `DEPLOY_HEALTHCHECK_URL`
- `MEDIA_DIR` and `MEDIA_HISTORY_DIR` for persistent uploaded photos

The script validates environments, HTTP(S) URLs, and ports before writing. Env
files are gitignored and forced to mode `0600`, including existing output files.

Supported flags:

- `--env <dev|prod>`
- `--site-url <url>`
- `--content-dir <path>`
- `--media-dir <path>`
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
- persistent uploaded-media and media-history directories

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
npm run bootstrap:vps
```

```bash
FORCE=1 RUN_SETUP_SYSTEMD=0 npm run bootstrap:vps -- bandland /var/www/bandland www-data /var/lib/bandland
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
- Normalizes all selected env values, including `ADMIN_PASSWORD_HASH`, into a
  root-owned mode-`0600` `.env.systemd` file. Custom env-file paths therefore
  work without relying on Next.js to reload `.env.production`.
- Maps optional `APP_PORT` to `PORT` inside `.env.systemd` so `next start`
  listens on the expected port.
- Passes through `AUTH_RATE_LIMIT_DIR` so login throttling can survive process
  restarts when pointed at persistent storage.
- Passes media storage paths through so uploaded photos survive restarts and deploys.

Example:

```bash
sudo ./scripts/setup-systemd.sh bandland /var/www/bandland www-data
```

### `./scripts/deploy.sh`

Pulls, preflights, installs, builds, restarts, and health-checks the service.

Environment variables:

- `SERVICE_NAME` (default `bandland`)
- `SERVICE_USER` (default `www-data`)
- `REPO_DIR` (defaults to script repo root)
- `ENV_FILE` (optional env file override)
- `HEALTHCHECK_URL` (optional deploy-time override)

Example:

```bash
SERVICE_NAME=bandland SERVICE_USER=www-data ./scripts/deploy.sh
```

### `npm run deploy:preflight -- --repo-dir <path> --service-name <name> --service-user <user> --env-file <path>`

Runs the same deploy preflight used by `./scripts/deploy.sh`.

Checks:

- required env values, bcrypt shape, URLs, and optional app port
- content and history paths as the configured service user
- uploaded media and media-history paths
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

## Docker and Podman Compose

The production image uses Next.js standalone output and seeds content only when
the persistent content volume is empty. Compose provides named volumes for
content, uploaded media, and login rate limits, and checks `/api/health`.

Generate production access values, then start one engine:

```bash
npm run setup-access -- --env prod --site-url https://your-site.example
npm run docker:up
# or: npm run podman:up
```

Stop the selected stack with `npm run docker:down` or `npm run podman:down`.
The wrappers read `.env.production`, validate required auth/site values, remove
Next.js dotenv escaping from the bcrypt hash, and pass normalized values to
Compose without printing secrets. Set `COMPOSE_ENV_FILE=/absolute/path` to use a
custom file.

For containerized development, generate `.env.local` with `--env dev`, then run
`npm run docker:dev` or `npm run podman:dev`.

Do not substitute `docker compose --env-file .env.production` for the npm
wrapper: Compose and Next.js interpret bcrypt `$` escaping differently. Direct
`docker:build`/`docker:run` and `podman:build`/`podman:run` remain useful as
ephemeral public-site smoke tests, but do not provide the persistent,
admin-enabled Compose configuration.

Back up all three production volumes. Content and media are irreplaceable site
data; the rate-limit volume is operational state and can be recreated if needed.

## Existing-site notes

- Persistent live content should use `CONTENT_DIR`, not the repo checkout.
- Persistent uploaded photos should use `MEDIA_DIR`, normally
  `/var/lib/bandland/media`, and be backed up together with `CONTENT_DIR` and
  their history directories.
- The admin dashboard at `/admin/dashboard` now shows:
  - storage mode
  - configured content, history, media, and rate-limit paths
  - latest backup timestamp
  - runtime config warnings
  - content-file validity status
- The public health endpoint is `GET /api/health`.

## Troubleshooting

### “Admin access is not configured”

The server does not see `ADMIN_PASSWORD_HASH` in its environment. Fix by:

1. Ensuring the selected production env file contains a valid hash.
2. Re-running `setup-systemd.sh` so `.env.systemd` is regenerated.
3. Restarting the service.

### Deploy preflight fails

Run:

```bash
npm run deploy:preflight -- --repo-dir /var/www/bandland --service-name bandland --service-user www-data --env-file /var/www/bandland/.env.production
```

Fix the reported env, path, or JSON issue before restarting the service.

### Rate limiting resets after every restart

Set `AUTH_RATE_LIMIT_DIR` to a persistent directory such as
`/var/lib/bandland/auth-rate-limit`, make sure the service user can write to it,
and restart the app.

### Photo uploads fail or disappear after deployment

Set `MEDIA_DIR` to a persistent directory such as `/var/lib/bandland/media`,
ensure its history directory exists, and grant the service user access:

```bash
sudo mkdir -p /var/lib/bandland/media/.history
sudo chown -R www-data:www-data /var/lib/bandland/media
```

Run the deployment preflight again before restarting the service.

If a reverse proxy rejects uploads before they reach Next.js, allow enough
request body space for the 10 MB application limit. For nginx, set
`client_max_body_size 11m;` in the site server block and reload nginx.

### Existing content would be overwritten during bootstrap

Bootstrap preserves existing files by default. If you intentionally want to
replace the destination JSON files, rerun with:

```bash
FORCE=1 npm run bootstrap:vps
```

### `git pull --ff-only` fails because `package-lock.json` is dirty

The deploy checkout has local tracked changes, so Git refuses to fast-forward.

This usually happens when someone ran `npm install` manually on the server or
used a different npm version than the repo's pinned `packageManager`.

Inspect the change first:

```bash
git diff -- package-lock.json
```

If the checkout should exactly match Git, discard the drift and rerun deploy:

```bash
git restore package-lock.json
./scripts/deploy.sh
```

If you want to keep the local diff for inspection, stash it instead:

```bash
git stash push package-lock.json
./scripts/deploy.sh
```

To reduce repeat lockfile drift, align the server npm version with the repo's
`packageManager` and prefer `npm ci` over manual `npm install` in the deploy
checkout.

### “Password did not match”

Verify the hash using:

```bash
node scripts/verify-access.mjs
```

If the log shows a hash length not equal to 60, check that `$` is escaped as
`\$` in `.env.production`.

### Compose reports an invalid or backslash-prefixed hash

Use `npm run docker:up` or `npm run podman:up` instead of passing
`.env.production` directly through Compose. The repo wrapper normalizes the
Next.js dotenv representation before the container is created.
