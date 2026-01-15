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

## Common scripts

- `npm run build` / `npm run start`
- `npm run lint` / `npm run typecheck`
- `npm test`

## Environment

Copy `env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL`.

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
