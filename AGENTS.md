# Bandland — Agent Guidelines

Band landing page for schmät with a **photocopied punk zine aesthetic**: cream paper, black ink, one hard red, torn paper, halftone band photos and a blackletter wordmark. It is music-first and fans-first: play the track, then the latest release, the next show and tickets. `/admin` keeps the old dark monochrome look. `DESIGN.md` holds the full design rationale and the contrast table.

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

Most components use the semantic aliases: `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--text-dim`, `--highlight` and `--focus`. Their Tailwind utilities are `bg-bg`, `text-text-muted`, `border-border` and so on. On paper they map to paper, paper-2, paper-3, an ink mix, ink, ink-2, ink-3, red and ink. The panel classes and the admin scope re-point them.

Contrast was computed, not eyeballed. Ink/paper is 15.59:1. Paper/red and red/paper are 5.12:1. Red/paper-2 is 4.54:1. Ink-3/paper-2 is 5.45:1. Red/ink is 3.04:1, which is enough for UI boundaries only.

Rules:

- Never hardcode colours in components; use tokens only.
- Use one accent: red. Text on red is paper, never ink. Red is never text on ink.
- Prefer translucent overlays (`color-mix` with tokens) over new colours.
- Maintain WCAG AA as a minimum, and recompute the ratios in `DESIGN.md` if a token changes.
- Admin stays dark. `src/app/admin/layout.tsx` renders a `data-admin-theme` wrapper, and `globals.css` re-declares the old dark values (`#060606` bg, `#f2f2f2` text, `#e36b6b` accent) for it and for `:root:has([data-admin-theme])`. Do not use zine classes in admin.

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

The older shared classes are still available and follow the tokens: `.btn-primary`, `.btn-secondary`, `.panel`, `.section-kicker`, `.display-title`, `.card-interactive`, `.player-bar` and `.player-range`.

## Typography

- **Sans**: Geist (variable) for headings and body. Body copy is sentence case. Big headlines use `.headline`.
- **Kicker**: the tracked all-caps `.kicker` label is allowed as a zine label. Keep it to one or two words; it is not for headings or body.
- **Brand**: Grenze Gotisch (blackletter, `--font-bandland-gothic`) for the wordmark only. Never use it for headings or body.
- **Mono**: Geist Mono for code and technical content.
- Use tabular numbers for dates, times and prices.

## Photos

- Use real band photos only. Never use generated imagery.
- `public/photos/` holds black-and-white, halftoned, grainy versions of `public/slideshow/01..03-hero.jpg`, in `-wide` (1200px), `-tall` (640x960) and `-square` (900x900) crops:
  - `01-guitar-bass`: guitarist and red-haired bassist, bass neck in the foreground.
  - `02-guitarist`: headbanging guitarist, the guitar-in-hand hero shot.
  - `03-drummer`: drummer singing at the kit.
- The originals in `public/slideshow/` stay untouched; they are the OG/Twitter images via `src/config/embed.ts`.
- To make new versions, use ImageMagick: Rec709 grayscale, sigmoidal contrast 7x45%, a 22% blend of an `h6x6o` ordered-dither halftone, and Gaussian noise. Export WebP at quality 68-70, at most 200 KB.

## Tech Stack (Current)

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4 (inline theme config in globals.css)
- Zod 4 for content schemas
- Vitest 3 + React Testing Library
- Fonts via `next/font/google` (Geist, Geist_Mono, Grenze_Gotisch)
- three + @react-three/fiber: still installed for the old 3D guitar. Removal is pending in WS3; do not build on it.

## Current Features

- **Home (being rebuilt in WS1).** It becomes a zine layout of these blocks:
  - a hero with the wordmark, Play with a live waveform, torn red paper with band photos, and a fret strip;
  - a red release panel;
  - a show panel with taped photos and an ink torn panel with the next show's venue and a Tickets button;
  - merch and outro links.
  - Admin widget order and visibility still decide which home sections show.
  - The old 3D guitar scroll journey (`src/components/home/*`, `src/components/guitar/*` apart from playback, the poster, motes, the intro and `Reveal`) is still in the tree until WS3 removes it. Its CSS (`.guitar-stage*`, `.journey-scrim`, `.stage-intro`, `[data-reveal]`) remains in `globals.css` until then.
- **Play.** The Play button plays `site.featuredTrack` ("Engel uit die Hemel", `public/audio/engel-uit-die-hemel.mp3`) through `createAudioPlayback` in `src/components/guitar/playback.ts`.
  - The file is only requested on the first press.
  - A Web Audio analyser turns the low end into a playback envelope, with a fixed-tempo pulse when Web Audio is unavailable.
  - A status line covers idle, loading, playing and load errors.
  - `PlaybackProvider` lives in the root layout, so the track keeps playing across client-side navigation and in a background tab.
- **Player bar.** Once Play has been pressed, a persistent player bar (`src/components/player/PlayerBar.tsx`) sits fixed along the bottom of every public page (not `/admin`).
  - It has play/pause, title, live waveform, seek, time, mute, volume and close.
  - It sets `--player-clear` to its height, which the footer pads by.
  - Closing it pauses the track. Navigating to `/admin` also pauses it.
  - Volume and mute persist in `localStorage` (`bandland-volume`). They go through a `GainNode` when Web Audio exists, otherwise through the audio element.
  - `createSimulatedPlayback` stays for tests (`PlaybackProvider` takes a `createDriver` prop).
- **Header and footer (being restyled in WS2).** The header will have a `Home` text link, Shows, Merch and the ENG / AFR toggle (active language red), with a thin ink rule under it and a menu on mobile. Socials live in the footer and the mobile menu.
- **Shows and merch.** The Shows and Merch pages read JSON documents from a private Vercel Blob store.
- **Admin.** The admin panel at `/admin` manages shows, merch and site settings: home widget order and visibility, latest release, footer and socials.
- **Locales.** The locale toggle is in the header; translations are in `src/i18n/translations.ts`.

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
- `SiteHeader`: nav and the locale toggle; the mobile menu adds socials. WS2 is restyling it.
- `SiteFooter`: copyright and tagline. WS2 is restyling it.
- `home/*`: the home page. WS1 is replacing it; the current `HomeJourney`/`JourneyStage` are the old 3D journey.
- Pending removal in WS3: `guitar/GuitarStage`, `guitar/Guitar`, `guitar/guitarModel`, `guitar/telecaster`, `guitar/journey`, `guitar/motes`, `guitar/useStagePulse`, `guitar/useScrollProgress`, `Reveal` and `IntroSeen`.
- Kept from `guitar/`: `guitar/playback`, `PlaybackProvider` and `guitar/PlayButton`. These are the music path.
- `player/PlayerBar` and `player/Waveform`: the site-wide player bar, rendered by the root layout. It is client-only and hidden until Play is first pressed. The waveform draws on a 2D canvas only while playing.
- `PageSection` / `PageIntro`: shared public-page layout and headings.
- `MerchCard`: product image, details and store link.
- Admin components are in `src/components/admin/`. `src/app/admin/layout.tsx` provides the dark admin theme scope.

Pattern: simple, functional components; client JS isolated to interactive features.

## Pages (App Router)

- `/`: home, being rebuilt as the zine layout (see Current Features).
- `/shows`: show list with ticket links.
- `/merch`: merch grid with external links.
- `/admin`: admin login and protected CRUD routes (`/admin/settings` for site settings). It is linked from the footer and uses the dark theme.

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
- The three.js canvas chunk (~242 KB gzip) is still loaded on `/` until WS1/WS3 remove it. Once it is gone, nothing on the site should need WebGL.

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
