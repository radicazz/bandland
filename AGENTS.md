# Bandland — Visual Theme & Build Guidelines

This repo should produce a modern, dynamic band landing page with a **moody, high‑contrast, black‑and‑white live‑photo** aesthetic: cinematic stage lighting, negative space, grain, and minimal chrome so the music stays the focus.

## Vibe keywords

- Noir / midnight / smoky venue
- Raw, intimate, “in the room” energy
- Editorial minimalism (big type, simple grids)
- High contrast, crisp highlights, deep shadows

## Color system (extracted vibe: grayscale)

Use a **neutral-only palette** by default (the reference imagery reads as monochrome). If you introduce an accent, keep it to **one** color and use it sparingly (CTAs, focus rings, active state only).

**Core neutrals (approximate)**

- `--bg`: `#060606` (near-black)
- `--surface`: `#0F0F10` (elevated panels)
- `--surface-2`: `#1A1B1D` (cards / subtle blocks)
- `--border`: `#2A2B2E` (hairline dividers)
- `--text`: `#F2F2F2` (primary text)
- `--text-muted`: `#B7B7B7` (secondary text)
- `--text-dim`: `#7A7A7A` (meta / helper text)
- `--highlight`: `#E6E2DA` (bone/off‑white highlight; e.g., instrument/spotlight feel)

**Optional single accent (only if needed)**

- Pick one: “signal red” (`#FF2D2D`) *or* “electric violet” (`#8B5CF6`).
- Never use multiple accents in the same UI surface.
- Ensure contrast meets WCAG for text and focus indicators.

**Implementation**

- Define tokens as CSS variables (design tokens first; no hardcoded hex in components).
- Prefer translucent overlays (`rgba`) over adding new colors.
- Use subtle gradients only to suggest lighting (radial vignette; ≤ 5% intensity).

## Typography

- **Headings:** condensed / display sans (tall, assertive; feels like gig posters).
- **Body:** modern neutral sans (high readability at small sizes).
- **Numbers / metadata:** tabular numbers; consider a mono or “UI sans with tabular” for show dates/times.

Guidelines:

- Big, simple hierarchy: 1 display size + 2 supporting sizes beats many sizes.
- Tight letter spacing for large headings; normal spacing for body.
- Avoid heavy drop-shadows; rely on contrast and spacing.

## Imagery & texture

- Prefer **black‑and‑white performance photography** (full-bleed hero, cropped details).
- Allow **grain** and **vignettes**; keep UI elements clean and sharp over it.
- Use 1–2 consistent treatments: slight film grain overlay, subtle vignette, and/or soft light leak.

## Layout & UI patterns

- Dark canvas with generous negative space.
- Strong grid: 12-col (desktop), 6-col (tablet), 4-col (mobile).
- Components should feel “poster-like”: big hero, then clear blocks (Shows, Music, Media, Merch, Mailing List).
- Favor **sticky primary CTA** (“Listen”, “Buy Tickets”, “Join Mailing List”) over many buttons.

## Motion & interaction

- Motion should evoke stage lighting: **slow fades**, **subtle parallax**, **gentle zoom** on imagery.
- Avoid gimmicky glitch unless the band identity explicitly calls for it.
- Respect `prefers-reduced-motion` (no parallax/auto-animations; instant transitions).

## Accessibility (non-negotiable)

- Semantic HTML first (headings, landmarks, buttons/links).
- Keyboard-visible focus (use the single accent or `--text` at high contrast).
- Minimum contrast: body text must meet WCAG AA; prefer AAA on the main dark background.
- Provide captions/transcripts for video/audio embeds when available.

## Performance & SEO

- Optimize media: AVIF/WebP with responsive `srcset`; lazy-load below the fold; prefetch only the hero.
- Budget: keep the landing page fast on mobile (avoid heavy JS for simple sections).
- Use structured data where appropriate (MusicGroup, events/shows).
- Open Graph / Twitter cards should default to a monochrome hero image.

## Dynamic, maintainable content

Treat content as data, not hardcoded JSX/HTML.

- Shows: drive from a typed data source (CMS, JSON, or Markdown frontmatter) with timezone-aware dates.
- Music: embed links (Spotify/Apple/Bandcamp), but wrap in components that can swap providers.
- Media: gallery items are content objects (image, alt, caption, credit).
- Merch: external storefront links + featured items; don’t reimplement a store unless required.

## Engineering conventions for scalability

- Prefer a **design-token + component** approach:
  - Tokens: colors, spacing, radius, shadows, motion durations.
  - Components: `Button`, `Card`, `Section`, `Hero`, `ShowList`, `Embed`, `Gallery`, `NewsletterForm`.
- Keep styling co-located and predictable (CSS modules/Tailwind/SCSS are fine—pick one and be consistent).
- Use type-safe schemas for content (e.g., Zod/TypeScript types) and validate at build time.
- Avoid global CSS leaks; keep “theme” global and everything else component-scoped.

## Recommended tech stack (TypeScript-first)

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS *or* CSS Modules (choose one and standardize)
- **Content/data (now):** local `content/` (JSON/MDX/Markdown frontmatter) validated with `zod`
- **Email capture (now):** server-side form handling (Server Actions / Route Handler) + a provider (Resend/Mailchimp/ConvertKit)
- **Tour dates (later):** fetch from a provider API (e.g., Bandsintown/Songkick) on the server with caching/revalidation
- **Merch (later):**
  - simplest: external link to Shopify/Bandcamp storefront
  - full shop: Shopify Storefront API + hosted checkout (or Stripe Checkout if not using Shopify)
- **Deploy:** Vercel (or Netlify/Cloudflare Pages) with image optimization and minimal client JS
