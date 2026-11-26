# Bandland — Agent Guidelines

Band landing page for schmät with a **photocopied punk zine aesthetic**: cream paper, black ink, one hard red, torn paper, halftone band photos and a blackletter wordmark. It is music-first and fans-first: play the track, then the latest release, the next show and tickets. `/admin` uses the same theme. `DESIGN.md` holds the full design rationale and the contrast table.

## Design Tokens

These live in `src/app/globals.css`. The raw tokens are exposed as Tailwind colours (`bg-paper`, `text-ink`, `bg-red`, ...).

| Token        | Value     | Use                                    |
| ------------ | --------- | -------------------------------------- |
| `--paper`    | `#f1e8d4` | Page background                        |
| `--paper-2`  | `#e6dbc2` | Surfaces, muted text on red            |
| `--paper-3`  | `#d9ccb0` | Cards, fret wires                      |
| `--ink`      | `#111010` | Text, rules, ink panels                |
| `--ink-2`    | `#3a3631` | Secondary text on paper                |
| `--ink-3`    | `#5a544b` | Metadata text on paper                 |
| `--red`      | `#c0151c` | The single accent: actions, red panels |
| `--red-deep` | `#8e0f15` | Hover/pressed red                      |

Most components use the semantic aliases: `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--text-dim`, `--highlight` and `--focus`. Their Tailwind utilities are `bg-bg`, `text-text-muted`, `border-border` and so on. On paper they map to paper, paper-2, paper-3, an ink mix, ink, ink-2, ink-3, red and ink. The panel classes re-point them.

Contrast was computed, not eyeballed. Ink/paper is 15.59:1. Paper/red and red/paper are 5.12:1. Red/paper-2 is 4.54:1. Ink-3/paper-2 is 5.45:1. Red/ink is 3.04:1, which is enough for UI boundaries only.

Rules:

- Never hardcode colours in components; use tokens only.
- Use one accent: red. Text on red is paper, never ink. Red is never text on ink.
- Prefer translucent overlays (`color-mix` with tokens) over new colours.
- Maintain WCAG AA as a minimum, and recompute the ratios in `DESIGN.md` if a token changes.
- Admin uses the same paper theme and zine buttons, kickers and headlines as the public pages. Keep it calm for form work: no torn edges, tilts or halftone around inputs.

## Zine Kit

These classes are in `globals.css` ("Zine kit"). They are CSS/SVG only, use no raster textures, keep their data URIs alpha-only and do not animate.

- `.paper-grain`: ink specks and mottling over the element's fill.
- `.panel-paper`, `.panel-red`, `.panel-ink`: coloured blocks that re-point the semantic tokens and `--focus` for their contents.
- `.torn-top`, `.torn-bottom`, `.torn-diag`: torn edges, painted on a `::before` from `--fill`, so children and focus rings are not clipped.
  - Fill them with a panel class or `--fill`, never `bg-*`.
  - Pad the torn side by about 1rem.
- `.halftone` (and `.halftone-red` duotone): goes on an image wrapper and gives a greyscale image with an ink dot screen.
- `.photo-frame` (with `.tilt-left`, `.tilt-right` or `.tilt-none`): goes on an image wrapper and gives a taped, tilted photo with a paper border.
- `.wordmark`: the blackletter band name.
- `.headline`, `.headline-italic`: a heavy, tight Geist headline. The italic variant is a synthetic oblique.
- `.kicker`: a small tracked-caps label ("RELEASE").
- `.btn-zine`, `.btn-zine-red`: square bordered buttons, either paper with ink or red with paper.
- `.fret-strip`: a decorative fretboard band. Always use it as `aria-hidden="true"`.

`.panel` (a paper card with an ink border and hard shadow, used by admin), `.menu-scroll`, `.player-bar` and `.player-range` are the other shared classes.

## Typography

- **Sans**: Geist (variable) for headings and body. Body copy is sentence case. Big headlines use `.headline`.
- **Kicker**: the tracked all-caps `.kicker` label is allowed as a zine label. Keep it to one or two words; it is not for headings or body.
- **Brand**: Grenze Gotisch (blackletter, `--font-bandland-gothic`) for the wordmark only. Never use it for headings or body.
- **Mono**: Geist Mono for code and technical content.
- Use tabular numbers for dates, times and prices.

## Photos

- Use real band photos only. Never use generated imagery.
- `public/photos/` holds black-and-white, halftoned, grainy versions of `public/slideshow/01..03-hero.jpg`, in `-wide` (1200px) and `-tall` (640x960) crops, plus `01-guitar-bass-square` (900x900). Only the crops the pages use are kept:
  - `01-guitar-bass`: guitarist and red-haired bassist, bass neck in the foreground.
  - `02-guitarist`: headbanging guitarist, the guitar-in-hand hero shot.
  - `03-drummer`: drummer singing at the kit.
- The originals in `public/slideshow/` stay untouched; `01` and `02` are the OG/Twitter images via `src/config/embed.ts`, `03` is kept as the drummer source.
- To make new versions, use ImageMagick: Rec709 grayscale, sigmoidal contrast 7x45%, a 22% blend of an `h6x6o` ordered-dither halftone, and Gaussian noise. Export WebP at quality 68-70, at most 200 KB.

## Tech Stack (Current)

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4 (inline theme config in globals.css)
- Zod 4 for content schemas
- Vitest 3 + React Testing Library
- Fonts via `next/font/google` (Geist, Geist_Mono, Grenze_Gotisch)
- No WebGL or 3D libraries; textures are CSS/SVG

## Current Features

- **Home** (`src/components/home/HomeZine.tsx`, a server component) is a static zine collage:
  - Hero: blackletter wordmark, tagline, Play with a live waveform (`HeroPlayer`), torn red paper with the guitarist photo and a taped second photo, and a fret strip along the bottom.
  - Panel row: a red release panel (title, RELEASE kicker, Listen, the Spotify embed loaded automatically or a click-to-load Apple Music embed via `ReleasePlayer`, a red halftone photo), then a 2x2 grid of taped photos and an ink torn panel with the next show's venue, date/city, All shows and Tickets. On md+ the photos sit left of the show panel; on phones the show comes before the photos.
  - Merch preview (up to three items, skipped when empty) and a "Find us" block with the socials.
  - Admin widget order and visibility decide the blocks. `release` and `nextShow` share the panel row and keep their relative order (the built-in default is release, next show, merch, so the release panel is on the left); `merch` is its own block. The photo grid stays even when both panel widgets are off. The widget `width` setting is preserved for older data but not used.
- **Play.** The Play button plays `site.featuredTrack` ("Engel uit die Hemel", `public/audio/engel-uit-die-hemel.mp3`) through `createAudioPlayback` in `src/components/player/playback.ts`.
  - The file is only requested on the first press.
  - A Web Audio analyser turns the low end into a playback envelope that drives the waveforms, with a fixed-tempo pulse when Web Audio is unavailable.
  - A status line covers idle, loading, playing and load errors.
  - `PlaybackProvider` lives in the root layout, so the track keeps playing across client-side navigation and in a background tab. Loading the click-to-load Apple Music embed pauses it.
- **Player bar.** Once Play has been pressed, a persistent player bar (`src/components/player/PlayerBar.tsx`) sits fixed along the bottom of every public page (not `/admin`).
  - It has play/pause, title, live waveform, seek, time, mute, volume and close.
  - It sets `--player-clear` to its height, which the footer pads by.
  - Closing it pauses the track. Navigating to `/admin` also pauses it.
  - Volume and mute persist in `localStorage` (`bandland-volume`). They go through a `GainNode` when Web Audio exists, otherwise through the audio element.
  - `createSimulatedPlayback` stays for tests (`PlaybackProvider` takes a `createDriver` prop).
- **Header and footer.** The header has a `Home` text link, Shows, Merch and the ENG / AFR toggle (active language red), with a thin ink rule under it and a menu on mobile. The footer is a torn ink panel with the wordmark, tagline, booking email, socials and the Admin link. Socials live in the footer, the mobile menu and the home "Find us" block.
- **Shows and merch.** The Shows and Merch pages read JSON documents from a private Vercel Blob store and render as zine pages; storage errors show the zine error state.
- **Admin.** The admin panel at `/admin` manages shows, merch and site settings: home widget order and visibility, latest release, footer and socials.
- **Locales.** The locale toggle is in the header; translations are in `src/i18n/translations.ts`.
- **Fonts.** `next/font` variables (`--font-geist-sans`, `--font-geist-mono`, `--font-bandland-gothic`) are set on `<html>`, because the Tailwind theme resolves `--font-sans` at `:root`.

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

Read via `getSiteSettings()` in `src/content/settings.ts`. It is cached with tag `settings`, and it falls back to defaults on storage errors so the layout never fails. Edit it at `/admin/settings`.

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

- `Container`: a max-w-6xl wrapper with padding.
- `SiteHeader`: nav and the locale toggle; the mobile menu adds socials.
- `SiteFooter`: wordmark, tagline, booking email, socials, copyright and the Admin link.
- `home/HomeZine`: the home page (server component). `home/HeroPlayer` (Play + waveform) and `home/ReleasePlayer` (release embed) are its client islands; `home/home.module.css` holds its torn-photo, torn-panel and marker styles.
- `player/playback`, `player/PlaybackProvider`, `player/PlayButton`: the music path (audio element, analyser envelope, context and the Play button).
- `player/PlayerBar` and `player/Waveform`: the site-wide player bar, rendered by the root layout. It is client-only and hidden until Play is first pressed. The waveform draws on a 2D canvas only while playing.
- `PageSection` / `PageIntro`: shared public-page layout and headings.
- `ShowCard`, `MerchCard`, `ContentImage`, `SocialLinks`, `ErrorState` (+ `ErrorMessagesProvider`): shared public building blocks.
- Admin components are in `src/components/admin/`.

Pattern: simple, functional components; client JS isolated to interactive features.

## Pages (App Router)

- `/`: home, the zine collage (see Current Features).
- `/shows`: show list with ticket links.
- `/merch`: merch grid with external links.
- `/admin`: admin login and protected CRUD routes (`/admin/settings` for site settings). It is linked from the footer and uses the site theme.

SEO:

- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/opengraph-image.tsx` (edge runtime)
- `src/app/twitter-image.tsx` (edge runtime)

## Accessibility Requirements

- Semantic HTML (proper heading hierarchy, landmarks, button/a tags)
- Skip-to-content link (implemented in layout)
- Keyboard focus visible: a 2px outline in `--focus` with a 3px offset. It is ink on paper and paper on red and ink panels.
- `prefers-reduced-motion` support (implemented in globals.css)
- Proper alt text for images. Decorative images and the fret strip use empty alt or `aria-hidden`.

## Layout System

- Grid: Tailwind responsive grid (md:grid-cols-2, md:grid-cols-3, etc.)
- Breakpoints: Tailwind defaults (sm 640, md 768, lg 1024, xl 1280)
- Spacing: generous whitespace, px-6 containers. Zine blocks can butt up against each other with torn edges instead of gaps.

## Motion Principles

- Keep motion minimal. The zine look is static print: torn edges, tilts and halftone never animate.
- Use colour transitions on hover and focus only.
- Respect `prefers-reduced-motion`; transitions are instant when it is enabled.
- No auto-playing audio. The track only plays after Play is pressed.

## Performance Budget

- Minimal client JS
- Static generation where possible
- Optimise images (next/image). Use the pre-processed `public/photos/` WebPs (each 200 KB or less) instead of filtering large originals.
- Textures are CSS/SVG (feTurbulence data URIs, gradients, clip-paths), never large rasters.
- Edge runtime for OG/Twitter images
- No WebGL: the old three.js guitar (~242 KB gzip chunk) is gone. `/` loads about 198 KB gzip of JS (Next/React runtime plus the player islands), measured with `gzip -9` over the page's script tags. The hero guitarist photo is the LCP image (`preload`).

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
- Uploaded photos go directly from the browser to the public media Blob store. Unreferenced uploads are cleaned up manually after checking both content namespaces
- Preview deployments read production content but cannot mutate or upload
- Local development uses an isolated `development` namespace
- One Vercel Firewall SDK rule rate-limits both admin sign-in entry points before bcrypt
- Server actions enforce Zod validation and optimistic concurrency before writing

## Extending

New components:

- Add to `src/components/`
- Use Tailwind utility classes and the zine kit classes
- Reference design tokens via Tailwind (e.g., `bg-paper`, `text-ink`, `bg-surface`, `text-text-muted`)

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
