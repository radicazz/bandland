# Punk redesign + cleanup — design

Source concept: `/tmp/claude-1000/-data-Coding-radicazz-bandland/121b2f87-5154-4fcb-a140-efe5c361c665/images/1.png` (desktop only; copy to `docs/concept.png` for the repo).

## Intent

Epic punk landing for schmät (Afrikaans skollie band): photocopied-zine look — cream paper, black ink, hard red, torn-paper edges, halftone photos, blackletter wordmark. Fans first: play music, latest release, next show, tickets. Real band photos only (`public/slideshow/*`), never generated imagery.

## Decisions (user-approved)

- Remove the procedural 3D guitar entirely (three, r3f, scene, motes, journey, poster). Keep `playback.ts`, `PlaybackProvider`, `PlayerBar`, `Waveform`, `PlayButton` (music-first).
- Admin (`/admin`) stays dark; admin tokens scoped so the public theme does not leak.
- Show card headline = next show's venue (no schema change).
- Header: no wordmark; text `Home` link, Shows, Merch, ENG / AFR toggle (active language red). Thin black rule under it.
- Admin widget order/visibility still drives which home sections show.

## Theme

Tokens (all colour via CSS variables): paper cream, ink black, punk red. Contrast computed, not eyeballed: ink/paper, paper/red, red/paper, paper/ink must all be >= AA (4.5:1 text, 3:1 large). `#e36b6b` is retired for public pages. Tracked all-caps small kicker (e.g. RELEASE) is allowed in the new design as a zine label. Paper grain, torn edges, halftone in CSS/SVG (feTurbulence, clip-path, mask); photos pre-processed to high-contrast B/W (originals kept for OG/Twitter).

## Home layout (desktop)

1. Hero band (cream): large blackletter wordmark left; play button + live waveform below; right: torn red paper with a halftone band photo cutout (guitar-in-hand shot) and a second photo; fret-board strip along the bottom edge (decorative, aria-hidden).
2. Lower row, two panels: left red panel "release" (title big sans, RELEASE kicker, Listen button, halftone image); right: 2x2 grid of taped B/W photos + black torn panel with italic show headline (venue), date/city, red Tickets button.
   Below: merch preview and outro links as simple zine blocks if enabled.
   Mobile: single column — hero (wordmark, play, one photo), release panel, show panel, photos 2x2, merch, links. Reduced motion honoured; any motion is minimal.

## Workstreams

- WS0 (serial): tokens/theme in globals.css, photo processing, AGENTS.md + DESIGN.md rewrite.
- WS1 (parallel after WS0): home page (HomeJourney replacement).
- WS2 (parallel after WS0): header, footer, /shows, /merch, translations for those.
- WS3 (last): cleanup — delete 3D stack + tests, prune deps, orphans (tsbuildinfo, anti-slop, unused Reveal/IntroSeen), docs.
  Acceptance: `npm run typecheck && npm run lint && npm test && npm run format:check && npm run build`, then desktop+mobile screenshots compared to concept.
