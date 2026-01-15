# Bandland — Agent Guidelines

Modern band landing page with **dark monochrome aesthetic**. High contrast, minimal UI, music-first.

## Design Tokens

Located in `src/app/globals.css`:

```css
--bg: #060606 /* near-black background */ --surface: #0f0f10 /* elevated panels */
  --surface-2: #1a1b1d /* cards */ --border: #2a2b2e /* dividers */ --text: #f2f2f2
  /* primary text */ --text-muted: #b7b7b7 /* secondary text */ --text-dim: #7a7a7a /* metadata */
  --highlight: #e6e2da /* bone/off-white accent */;
```

**Rules:**

- Never hardcode colors in components; use design tokens only
- Single-accent approach (highlight only)
- Translucent overlays preferred over new colors
- Maintain WCAG AA minimum (AAA preferred on dark bg)

## Typography

- **Sans:** Geist (variable font) for headings & body
- **Mono:** Geist Mono for code/technical content
- Use tabular numbers for dates/times/prices

## Tech Stack (Current)

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS 4 (inline theme config in globals.css)
- **Validation:** Zod 4 for content schemas
- **Testing:** Vitest 3 + React Testing Library
- **Fonts:** next/font/google (Geist, Geist_Mono)

## Content System

**Location:** `content/` (JSON files)

### Shows (`content/shows.json`)

```ts
{
  id: string,
  date: string,        // ISO 8601 with timezone
  venue: string,
  city: string,
  ticketUrl?: string   // optional
}
```

### Merch (`content/merch.json`)

```ts
{
  id: string,
  name: string,
  href: string,        // valid URL required
  price?: string       // optional display string
}
```

**Validation:** Runtime via Zod schemas in `src/content/schema.ts`

## Site Config

**Location:** `src/config/site.ts`

```ts
{
  name: string,
  description: string,
  contactEmail: string,
  socials: Array<{ label: string, href: string }>
}
```

## Component Architecture

**Existing components:**

- `Container` — max-w-6xl wrapper with padding
- `SiteHeader` — nav with logo + links
- `SiteFooter` — copyright + tagline

**Pattern:** Simple, functional components. No state management needed yet.

## Pages (App Router)

- `/` — Home (hero + sections grid)
- `/shows` — Show list with ticket links
- `/merch` — Merch grid with external links

**SEO:**

- `src/app/sitemap.ts` — dynamic sitemap
- `src/app/robots.ts` — robots.txt
- `src/app/opengraph-image.tsx` — OG image (edge runtime)
- `src/app/twitter-image.tsx` — Twitter card (edge runtime)

## Accessibility Requirements

- Semantic HTML (use proper heading hierarchy, landmarks, button/a tags)
- Skip-to-content link (implemented in layout)
- Keyboard focus visible (2px outline, 3px offset)
- `prefers-reduced-motion` support (implemented in globals.css)
- Proper alt text for images

## Layout System

- **Grid:** Tailwind's responsive grid (md:grid-cols-2, md:grid-cols-3, etc.)
- **Breakpoints:** Tailwind defaults (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Spacing:** Generous whitespace, px-6 containers

## Motion Principles

- Slow fades, subtle transitions
- Respect `prefers-reduced-motion` (instant transitions when enabled)
- No auto-playing animations
- Parallax/zoom effects only if user motion preferences allow

## Performance Budget

- Minimal client JS (no heavy dependencies)
- Static generation where possible
- Optimize images (next/image automatic)
- Edge runtime for OG images

## Development Workflow

```bash
npm install      # install deps
pnpm install     # install deps (pnpm)
npm run dev         # dev server
pnpm dev            # dev server (pnpm)
npm test           # run tests
npm run typecheck  # TypeScript validation
npm run lint       # ESLint
npm run format     # Prettier
```

## Git Commit Format

- Use Conventional Commits: `feat: ...`, `fix: ...`, `chore: ...`, `refactor: ...`, `test: ...`, `docs: ...`
- Keep the subject short, present tense, and scoped to a single change

## Environment Variables

- `NEXT_PUBLIC_SITE_URL` — canonical site URL (for metadata/sitemap)

## Adding Content

1. Edit JSON files in `content/` directory
2. Schema validation runs on page load
3. Restart dev server to see changes

## Extending

**New components:**

- Add to `src/components/`
- Use Tailwind utility classes
- Reference design tokens via Tailwind (e.g., `bg-surface`, `text-text-muted`)

**New pages:**

- Add folder in `src/app/`
- Include `page.tsx` + optional `metadata` export

**New content types:**

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
