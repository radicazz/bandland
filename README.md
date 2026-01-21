# Bandland

Modern band landing page with a dark monochrome aesthetic. Built with Next.js 16, React 19, Tailwind CSS 4, and TypeScript.

Design + theme rules live in `AGENTS.md`.

## Quick start

```bash
npm install
npm run dev
```

Or with pnpm:

```bash
pnpm install
pnpm dev
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

## VPS deployment (recommended data layout)

To keep admin edits persistent while still deploying code updates, store content
JSON outside the git repo and point the app to it.

1. Create a data directory on the VPS

   ```bash
   sudo mkdir -p /var/lib/bandland/content
   sudo chown -R <service-user>:<service-user> /var/lib/bandland/content
   ```

2. Copy your current content files once

   ```bash
   cp content/shows.json /var/lib/bandland/content/
   cp content/merch.json /var/lib/bandland/content/
   ```

3. Set environment variables on the service

   - `CONTENT_DIR=/var/lib/bandland/content`
   - Optional: `CONTENT_HISTORY_DIR=/var/lib/bandland/content/.history`

4. Deploy as usual (your existing deploy script still works)

## Common scripts

- `npm run build` / `npm run start`
- `npm run lint` / `npm run typecheck`
- `npm test`

## Environment

Copy `env.example` to `.env.local` and set:
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_PASSWORD_HASH`
- `AUTH_SECRET`
- `AUTH_URL`

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
