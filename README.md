# Bandland

Modern band landing page with a dark monochrome aesthetic. Built with Next.js 16, React 19, Tailwind CSS 4, and TypeScript.

Design + theme rules live in `AGENTS.md`.

## Quick start

```bash
npm install
npm run setup-access -- --env dev --site-url http://localhost:3000
npm run dev
```

`setup-access` prompts for the admin password, writes a protected `.env.local`,
and configures ignored media storage under `content/media`. Sign in at `/admin`,
add a show, and choose a JPEG, PNG, or WebP photo to test the same upload path
used in production.

Open http://localhost:3000

## Basic edits

- `content/shows.json` — tour dates
- `content/merch.json` — merch items
- `src/config/site.ts` — band name, description, socials
- `src/i18n/translations.ts` — UI copy + locales
- `public/slideshow/` — hero slideshow images (optional)

## Admin panel

Admin access lives at `/admin` and writes directly to the JSON content files.
In production, you can keep these files outside the repo by setting `CONTENT_DIR`.
The protected dashboard now includes a read-only site-operations section so you
can confirm storage paths, backups, runtime config, and content health from the
live admin UI.

Setup:

1. Run `npm run setup-access -- --env dev --site-url http://localhost:3000`
2. Start or restart the dev server
3. Run `npm run verify-access` if you want to confirm the stored password

Data written by the admin panel:

- `content/shows.json`
- `content/merch.json`
- `content/admin-audit.json`
- Backup snapshots in `content/.history/`

## VPS deployment (recommended for an existing live site)

To keep admin edits persistent while still deploying code updates, store content
JSON outside the git repo and point the app to it.

### First-time bootstrap

1. Generate production env values:

   ```bash
   npm run setup-access -- --env prod --site-url https://your-site.example
   ```

2. Bootstrap persistent directories and seed content without overwriting existing live data:

   ```bash
   npm run bootstrap:vps
   ```

   For a local dry run against user-owned temp directories, use
   `BOOTSTRAP_USE_SUDO=never RUN_SETUP_SYSTEMD=0 SERVICE_USER=$USER`.

3. Deploy and health-check the app:

   ```bash
   ./scripts/deploy.sh
   ```

### Routine deploys

Once the site is bootstrapped:

```bash
./scripts/deploy.sh
```

That flow now runs a production preflight, rebuilds, restarts the `systemd`
service, and verifies `GET /api/health` before reporting success.

Set `SERVICE_USER` when the unit does not run as `www-data`, and set `ENV_FILE`
when production configuration is stored somewhere other than
`.env.production`.

## Container deployment

Generate production access values first, then use the env-aware wrappers. They
normalize the bcrypt value correctly before invoking Docker Compose or Podman
Compose.

```bash
npm run setup-access -- --env prod --site-url https://your-site.example
npm run docker:up
# or: npm run podman:up
```

Stop the stack with `npm run docker:down` or `npm run podman:down`. Production
content, uploaded media, and login rate limits use named volumes. The direct
`docker:run` and `podman:run` commands are ephemeral public-site smoke tests;
use the Compose commands for a persistent admin-enabled deployment.

For a custom env path, set `COMPOSE_ENV_FILE=/path/to/env`. Do not pass the
Next.js-formatted env file directly to `docker compose --env-file`; the npm
wrapper removes dotenv escaping before Compose receives the password hash.

## Common scripts

- `npm run build` / `npm run start`
- `npm run lint` / `npm run typecheck`
- `npm test`
- `npm run bootstrap:vps`
- `npm run deploy:preflight`
- `npm run setup-access` / `npm run verify-access`
- `npm run docker:up` / `npm run docker:down`
- `npm run podman:up` / `npm run podman:down`

## Environment

Use `setup-access` to generate `.env.local` or `.env.production`. `env.example`
documents the available values:

- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_PASSWORD_HASH`
- `AUTH_SECRET`
- `AUTH_URL`
- Optional: `AUTH_RATE_LIMIT_DIR`
- `MEDIA_DIR` and optional `MEDIA_HISTORY_DIR` for uploaded photos
- Optional: `APP_PORT`
- Optional: `DEPLOY_HEALTHCHECK_URL`

Generated env files contain secrets, are gitignored, and are forced to mode
`0600`.

## Licensing

This project uses a **dual licensing model**:

### Code License

All source code is licensed under the [MIT License](./LICENSE). This includes:

- The Next.js application code
- Components and utilities in `src/`
- Configuration files
- Content schemas and loaders

You're free to use, modify, and distribute the code according to the MIT terms.

### Brand Assets License

Visual assets in this repository are **NOT** included in the open-source license. This includes:

- Files in `public/logos/`
- Files in `public/slideshow/`
- Album artwork, promotional images, and band photography

These assets are proprietary and remain under copyright. Any use, modification, or distribution requires explicit written permission. See [`LICENSE.ASSETS`](./LICENSE.ASSETS) for details.
