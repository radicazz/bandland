# Bandland

Modern band landing page with a dark monochrome aesthetic. Built with Next.js 16, React 19, Tailwind CSS 4, and TypeScript.

Design + theme rules live in `AGENTS.md`.

## Quick start

```bash
npm install
npm run dev
```

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
1. Copy `env.example` to `.env.local`
2. Run `npm run setup-access` to generate `ADMIN_PASSWORD_HASH` + `AUTH_SECRET`
3. Set `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000`)
4. Restart the dev server

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
   sudo npm run bootstrap:vps
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

## Common scripts

- `npm run build` / `npm run start`
- `npm run lint` / `npm run typecheck`
- `npm test`
- `npm run bootstrap:vps`
- `npm run deploy:preflight`
- `npm run setup-access` / `npm run verify-access`

## Environment

Copy `env.example` to `.env.local` and set:
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_PASSWORD_HASH`
- `AUTH_SECRET`
- `AUTH_URL`
- Optional: `AUTH_RATE_LIMIT_DIR`
- Optional: `APP_PORT`
- Optional: `DEPLOY_HEALTHCHECK_URL`

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
