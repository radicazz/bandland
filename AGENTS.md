# Bandland — Agent Guidelines

Modern band landing page with a **dark monochrome aesthetic**. High contrast, minimal UI, music-first.

## Design Tokens

Located in `src/app/globals.css`:

```css
--bg: #060606 /* near-black background */ --surface: #0f0f10 /* elevated panels */
  --surface-2: #1a1b1d /* cards */ --border: #2a2b2e /* dividers */ --text: #f2f2f2
  /* primary text */ --text-muted: #b7b7b7 /* secondary text */ --text-dim: #7a7a7a /* metadata */
  --highlight: #e36b6b /* muted red accent */;
```

Rules:

- Never hardcode colors in components; use design tokens only
- Single-accent approach (highlight only)
- Translucent overlays preferred over new colors
- Maintain WCAG AA minimum (AAA preferred on dark bg)

## Typography

- Sans: Geist (variable) for headings & body
- Mono: Geist Mono for code/technical content
- Use tabular numbers for dates/times/prices

## Tech Stack (Current)

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4 (inline theme config in globals.css)
- Zod 4 for content schemas
- Vitest 3 + React Testing Library
- Fonts via `next/font/google` (Geist, Geist_Mono)

## Current Features

- Home hero uses the image manifest in `src/config/slideshow.ts` for files under `public/slideshow/`
- Latest release card with Spotify embed in `src/components/HomeCarousel.tsx`
- Shows + Merch pages read JSON documents from a private Vercel Blob store
- Admin panel at `/admin` for managing shows + merch
- Locale toggle in header; translations in `src/i18n/translations.ts`

## Content System

Location: private Vercel Blob objects under `content/{production|development}/`

Shows (`shows.json`)

```ts
{
  id: string,          // uuid
  date: string,        // ISO 8601 with timezone
  venue: string,
  city: string,
  price?: string,
  ticketUrl?: string,
  imageUrl?: string,
  createdAt: string,
  updatedAt: string
}
```

Merch (`merch.json`)

```ts
{
  id: string,          // uuid
  name: string,
  description?: string,
  price: string,
  href: string,        // valid URL required
  imageUrl?: string,
  createdAt: string,
  updatedAt: string
}
```

Admin audit (`admin-audit.json`, capped at 100 entries)

```ts
{
  id: string,          // uuid
  actor: string,
  action: "create" | "update" | "delete",
  entity: "shows" | "merch",
  entityId: string,    // uuid
  createdAt: string,
  details?: string
}
```

Validation: runtime via Zod schemas in `src/content/schema.ts`

## I18n

- Locales: `en`, `af`
- Copy lives in `src/i18n/translations.ts`
- Locale stored in `bandland-locale` cookie and read in `src/i18n/server.ts`

## Site Config

Location: `src/config/site.ts`

```ts
{
  name: string,
  description: string,
  contactEmail: string,
  socials: Array<{ label: string, href: string }>
}
```

## Component Architecture

- `Container` — max-w-6xl wrapper with padding
- `SiteHeader` — nav + locale toggle + socials
- `SiteFooter` — copyright + tagline
- `HomeCarousel` — latest release + feature tiles
- Admin components in `src/components/admin/`

Pattern: simple, functional components; minimal client JS (currently only header).

## Pages (App Router)

- `/` — Home (slideshow hero + latest release)
- `/shows` — Show list with ticket links
- `/merch` — Merch grid with external links
- `/admin` — Admin login + protected CRUD routes

SEO:

- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/opengraph-image.tsx` (edge runtime)
- `src/app/twitter-image.tsx` (edge runtime)

## Accessibility Requirements

- Semantic HTML (proper heading hierarchy, landmarks, button/a tags)
- Skip-to-content link (implemented in layout)
- Keyboard focus visible (2px outline, 3px offset)
- `prefers-reduced-motion` support (implemented in globals.css)
- Proper alt text for images (decorative images should use empty alt)

## Layout System

- Grid: Tailwind responsive grid (md:grid-cols-2, md:grid-cols-3, etc.)
- Breakpoints: Tailwind defaults (sm 640, md 768, lg 1024, xl 1280)
- Spacing: generous whitespace, px-6 containers

## Motion Principles

- Slow fades, subtle transitions
- Respect `prefers-reduced-motion` (instant transitions when enabled)
- No auto-playing animations beyond the hero slideshow
- Parallax/zoom only if user motion preferences allow

## Performance Budget

- Minimal client JS
- Static generation where possible
- Optimize images (next/image)
- Edge runtime for OG/Twitter images

## Development Workflow

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run format
```

## Git Commit Format

- Use Conventional Commits: `feat: ...`, `fix: ...`, `chore: ...`, `refactor: ...`, `test: ...`, `docs: ...`
- Keep the subject short, present tense, and scoped to a single change

## Environment Variables

- `NEXT_PUBLIC_SITE_URL` — canonical site URL (metadata/sitemap)
- `ADMIN_PASSWORD_HASH` — bcrypt hash for admin login
- `AUTH_SECRET` — Auth.js secret
- `CONTENT_BLOB_READ_WRITE_TOKEN` — private content Blob store token
- `MEDIA_BLOB_READ_WRITE_TOKEN` — public uploaded-media Blob store token

Generate auth values with `npm run auth:generate`. Pull Development values with
`npx vercel env pull .env.local`; generated env files are gitignored.

## Adding Content

1. Sign in at `/admin`
2. Create or edit shows and merch
3. Server actions validate content before conditional Blob writes

## Admin Panel Notes

- Admin content and audit records use the private content Blob store
- Uploaded photos go directly from the browser to the public media Blob store
- Preview deployments read production content but cannot mutate or upload
- Local development uses an isolated `development` namespace
- Vercel Firewall rate-limits the credentials callback
- Server actions enforce Zod validation and optimistic concurrency before writing

## Extending

New components:

- Add to `src/components/`
- Use Tailwind utility classes
- Reference design tokens via Tailwind (e.g., `bg-surface`, `text-text-muted`)

New pages:

- Add folder in `src/app/`
- Include `page.tsx` + optional `metadata` export

New content types:

- Define Zod schema in `src/content/schema.ts`
- Create loader in `src/content/`
- Add JSON file in `content/`

## Key Constraints

- TypeScript strict mode enabled
- No `any` types
- Content must validate via Zod schemas
- All colors via CSS variables
- Accessibility is non-negotiable
- Keep bundle size minimal
