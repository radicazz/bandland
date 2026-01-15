# Bandland — Agent Guidelines

Modern band landing page with a **dark monochrome aesthetic**. High contrast, minimal UI, music-first.

## Design Tokens

Located in `src/app/globals.css`:

```css
--bg: #060606 /* near-black background */ --surface: #0f0f10 /* elevated panels */
  --surface-2: #1a1b1d /* cards */ --border: #2a2b2e /* dividers */ --text: #f2f2f2
  /* primary text */ --text-muted: #b7b7b7 /* secondary text */ --text-dim: #7a7a7a /* metadata */
  --highlight: #e6e2da /* bone/off-white accent */;
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

- Home hero uses a slideshow sourced from `public/slideshow/` (image files only)
- Latest release card with Spotify embed in `src/components/HomeCarousel.tsx`
- Shows + Merch pages read JSON from `content/`
- Locale toggle in header; translations in `src/i18n/translations.ts`

## Content System

Location: `content/` (JSON files)

Shows (`content/shows.json`)
```ts
{
  id: string,
  date: string,        // ISO 8601 with timezone
  venue: string,
  city: string,
  ticketUrl?: string
}
```

Merch (`content/merch.json`)
```ts
{
  id: string,
  name: string,
  href: string,        // valid URL required
  price?: string
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

Pattern: simple, functional components; minimal client JS (currently only header).

## Pages (App Router)

- `/` — Home (slideshow hero + latest release)
- `/shows` — Show list with ticket links
- `/merch` — Merch grid with external links

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
npm run format
```

## Git Commit Format

- Use Conventional Commits: `feat: ...`, `fix: ...`, `chore: ...`, `refactor: ...`, `test: ...`, `docs: ...`
- Keep the subject short, present tense, and scoped to a single change

## Environment Variables

- `NEXT_PUBLIC_SITE_URL` — canonical site URL (metadata/sitemap)

## Adding Content

1. Edit JSON files in `content/`
2. Schema validation runs on page load
3. Restart dev server to see changes

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
