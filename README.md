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
