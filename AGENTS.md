# Bandland — Agent Guidelines

Modern band landing page with a **dark monochrome aesthetic**. High contrast, minimal UI, music-first.

## Design Tokens

Located in `src/app/globals.css`:

```css
--bg: #060606 /* near-black background */ --surface: #0f0f10 /* elevated panels */
  --surface-2: #1a1b1d /* cards */ --border: #2e2f33 /* dividers */ --text: #f2f2f2
  /* primary text */ --text-muted: #c2c2c2 /* secondary text */ --text-dim: #a1a1a1 /* metadata */
  --highlight: #e36b6b /* muted red accent */;
```

Rules:

- Never hardcode colors in components; use design tokens only
- Single-accent approach (highlight only)
- Translucent overlays preferred over new colors
- Maintain WCAG AA minimum (AAA preferred on dark bg)

## Typography

- Sans: Geist (variable) for headings & body; sentence case, no wide-tracked all-caps labels
- Brand: Grenze Gotisch (blackletter) for the wordmark only — never for headings or body
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
- three + @react-three/fiber for the procedural 3D guitar on `/` (client-only, lazy-loaded)

## Current Features

- Home is a scroll journey over a full-screen pinned procedural 3D guitar (`src/components/home/HomeJourney.tsx`); the sections scroll over the stage, which starts under the header. Phones: the guitar is centred behind the text and dims (scrim driven by scroll position) once the reader leaves the hero. md+: the text is a left column and the render is shifted right by `STAGE_SHIFT` (`guitar/journey.ts`), mirrored by the CSS backdrop and the poster. Stops: hero (wordmark, tagline, Play) → headstock (latest release + Spotify embed) → neck (upcoming shows, one fret each; the fret of the row in view lights red) → body (merch) → outro (links). Admin widget order/visibility drives the neck/body stops (the release stop is always second, right after the hero, whenever its widget is enabled, regardless of widget order); empty merch skips the body stop. The widget `width` setting is still stored and editable in admin but no longer affects `/` (the journey is a single column)
- Play button plays `site.featuredTrack` ("Engel uit die Hemel", `public/audio/engel-uit-die-hemel.mp3`) through `createAudioPlayback` in `src/components/guitar/playback.ts`. The file is only requested on the first press; a Web Audio analyser turns the track's low end into the playback envelope (each detected beat plucks a string), with a fixed-tempo pulse when Web Audio is unavailable. A status line under the button covers idle, loading, playing and load errors. `PlaybackProvider` lives in the root layout, so the track keeps playing in a background tab and across client-side navigation (a full reload resets it). Once Play has been pressed, a persistent player bar (`src/components/player/PlayerBar.tsx`: play/pause, title, live waveform, seek, time, mute, volume, close) sits fixed along the bottom of every public page (not `/admin`); closing it pauses the track and it returns on the next play. Volume and mute persist in `localStorage` (`bandland-volume`). `createSimulatedPlayback` stays for tests (`PlaybackProvider` takes a `createDriver` prop)
- The guitar is a procedural piano-black Telecaster, HH layout (clearcoat single-cut slab, black one-piece pickguard, two humbuckers, hardtail bridge plate with six block saddles, angled chrome control plate with selector and two knobs, rounded neck, 22 fret wires, Tele headstock with six-in-line tuners, a string tree and the wordmark). The neck stays dark to keep the palette monochrome. It is lit by a softbox environment baked once with `PMREMGenerator` (no drei) plus a key and two rim lights. Red appears only for live state: the lit fret, and while playing the pickups, plucked strings and a warm under-light
- Scroll motion (`Guitar.tsx`, all off under reduced motion): the camera follows its pose on a slightly underdamped spring and swings out and to alternating sides between stops (`TRANSITION_ARC` in `journey.ts`); the guitar yaws against the scroll direction and springs back with one wobble (`SwayRig`); the strings shiver with scroll speed (movement only, no red); and each time a new show row lights its fret, that string is plucked
- The canvas is transparent; the stage backdrop (light pool, floor glow, vignette, grain; red floor spill under `[data-playing]`) is CSS (`.guitar-stage` in `globals.css`) so the poster and the canvas share it
- Transparent portrait poster `public/guitar-poster.webp` (hero pose, rendered narrower than any phone so `object-contain` always fits it by height) shows first, fades out once the canvas draws its first frame, and stays as the fallback without WebGL; reduced motion pins the camera to the hero pose. Re-render it from the hero pose whenever the model or lighting changes
- Stops carry numbered kickers and `#stop-{id}` anchors; site navigation lives only in the header
- The header has no bar: it fades from the background (`.site-header` in `globals.css`), with Shows/Merch and the ENG/AFR toggle on the right on desktop and a menu on mobile; socials live in the footer and mobile menu
- `public/slideshow/` images are no longer shown on the home page but are still the OG/Twitter images via `src/config/embed.ts`
- Shows + Merch pages read JSON documents from a private Vercel Blob store
- Admin panel at `/admin` for managing shows, merch, and site settings (home widget order/visibility, latest release, footer, socials)
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

Site settings (`settings.json`, falls back to built-in defaults when missing)

```ts
{
  hero: { tagline?: string },
  widgets: Array<{ id: "nextShow" | "release" | "merch", enabled: boolean, width: "half" | "full" }>, // array order = home page order
  release: { title: string, description?: string, href: string, embedUrl?: string },
  footer: { tagline?: string, contactEmail: string },
  socials: Array<{ label: "Instagram" | "Spotify" | "Apple Music" | "TikTok" | "YouTube" | "Linktree", href: string }>
}
```

Read via `getSiteSettings()` in `src/content/settings.ts` (cached, tag `settings`; falls back to defaults on storage errors so the layout never fails). Edited at `/admin/settings`.

Admin audit (`admin-audit.json`, capped at 100 entries)

```ts
{
  id: string,          // uuid
  actor: string,
  action: "create" | "update" | "delete",
  entity: "shows" | "merch" | "settings",
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
- `SiteHeader` — wordmark, nav + locale toggle (mobile menu adds socials)
- `SiteFooter` — copyright + tagline
- `home/HomeJourney` — server component; renders the journey sections as HTML beside the sticky stage
- `home/JourneyStage` — client; owns the scroll position (camera + scrim) and maps the show row on the reading line to a lit fret
- `guitar/GuitarStage` — client; poster + lazy (`next/dynamic`, `ssr: false`) canvas with WebGL/context-loss/error fallbacks
- `guitar/Guitar` — r3f scene (procedural body, neck, frets, strings, headstock) and camera rig
- `guitar/guitarModel` (named anchors, GLB swap point), `guitar/journey` (route + camera poses), `guitar/useScrollProgress`, `guitar/playback` + `PlaybackProvider`, `guitar/PlayButton`
- `player/PlayerBar` + `player/Waveform` — client; site-wide player bar rendered by the root layout (hidden until Play is first pressed); the waveform draws on a 2D canvas only while playing
- `PageSection` / `PageIntro` — shared public-page layout and headings
- `MerchCard` — product image, details, and store link
- Admin components in `src/components/admin/`

Pattern: simple, functional components; client JS isolated to interactive features.

## Pages (App Router)

- `/` — Home (3D guitar scroll journey: hero, latest release, shows, merch, outro)
- `/shows` — Show list with ticket links
- `/merch` — Merch grid with external links
- `/admin` — Admin login + protected CRUD routes (`/admin/settings` for site settings); linked from the footer

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
- No auto-playing animations or audio; the guitar only animates while scrolling (and briefly settles after) or after Play is pressed
- Parallax/zoom only if user motion preferences allow

## Performance Budget

- Minimal client JS
- Static generation where possible
- Optimize images (next/image)
- Edge runtime for OG/Twitter images
- The three.js canvas is a separate chunk loaded only on `/`, after first paint and only when WebGL is available (~247 KB gzip); the poster is the LCP image. It renders on demand when idle, continuously only while playing, and stops when hidden/off-screen; DPR capped at 2

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
