# 3D Guitar Home Page — Design

Date: 2026-11-15
Status: Draft for review

## Goal

Turn the home page into a scroll journey around a pinned, procedural 3D guitar. A Play button makes the guitar "play" using a simulated signal (no real audio yet). The guitar's anatomy structures the page: the headstock holds the latest release, the neck holds upcoming shows, the body holds merch. Dark monochrome look with the single red accent is preserved.

## Decisions

- **Audio:** none for now. A `PlaybackSignal` interface is defined so a real Web Audio driver can be added later without touching the scene.
- **Model:** procedural three.js geometry now; `guitarModel.ts` exposes named anchors so a GLB can replace it later.
- **Layout:** scroll journey (camera travels along a sticky canvas); content remains real HTML beside it.
- `/shows` and `/merch` stay as full pages; home sections link to them.

## Architecture

```
src/components/guitar/
  GuitarStage.tsx      client; lazy-loaded canvas (next/dynamic, ssr:false)
  Guitar.tsx           procedural body, neck, frets, strings, pickups
  guitarModel.ts       named anchors (headstock, fret N, sound hole); GLB swap point
  useScrollCamera.ts   scroll progress -> camera keyframes
  playback.ts          PlaybackSignal interface + simulated driver
src/components/home/
  HomeJourney.tsx      server component; renders HTML sections beside the stage
```

- react-three-fiber + three, loaded only on `/`. First paint is the HTML hero with a static poster image (LCP element); the canvas loads afterwards.
- `HomeJourney` fetches shows, merch and settings as today and renders ordinary sections in the scroll column. The canvas is a `position: sticky` decorative layer, `aria-hidden`; the page is fully usable without it.
- Admin widget order/visibility continues to drive which sections render.

## Scroll choreography

Five camera stops, single `scrollYProgress` (0–1), eased interpolation between keyframes defined as one data array in `useScrollCamera.ts`. No scroll libraries.

| Stop        | Camera                                              | HTML                                                                                                 | Guitar reaction                                      |
| ----------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1 Hero      | Full guitar, slow idle rotation, slightly low angle | Wordmark, tagline, Play button                                                                       | Strings idle; on play they vibrate, pickups glow red |
| 2 Headstock | Push in on headstock/pegs                           | Latest release (title, description, Spotify link)                                                    | Pegs turn slowly; thin red ring pulses with `level`  |
| 3 Neck      | Slide down neck fret by fret                        | Upcoming shows as a vertical timeline, one per fret; next show first and highlighted with ticket CTA | Fret lights as each show enters view                 |
| 4 Body      | Pull out to sound hole/body                         | Merch items beside body with price + store link                                                      | Body pulses subtly with `level`                      |
| 5 Outro     | Pull back to full guitar                            | Socials, contact, links to `/shows` and `/merch`                                                     | Strings relax, guitar settles                        |

- **Widget mapping:** admin widgets map to stops 3 and 4. A disabled widget's stop is skipped and the route shortens; reordering reorders the route. Release is always stop 2.
- **Empty states:** no upcoming shows -> existing fallback copy at the neck stop. No merch -> stop 4 skipped.
- **Mobile:** same journey; canvas shorter and pinned to the top half, text cards below.
- **Reduced motion:** camera does not scrub; guitar stays at hero pose, sections are stacked blocks; Play only changes string glow.
- **Fallback:** no WebGL or poor performance -> static poster and plain stacked page.

## Playback

- `PlaybackSignal`: `{ playing: boolean, level: number (0–1), pluck(stringIndex: number): void }`.
- Simulated driver: looping 4-bar riff on a timer; each beat plucks a string; `level` follows a decaying envelope; stops cleanly on pause and on unmount.
- Future audio driver: `AnalyserNode` feeds `level`, onset detection feeds `pluck`. Scene unchanged.
- Play control is a real `<button>` with `aria-pressed` and a visible label. No sound is produced.

## Look

- Colors from design tokens only; materials read CSS variables once at mount.
- Near-black matte body (`--surface`, `--surface-2`), `--border` fret lines, `--text` strings. `--highlight` red only for activity (pickups, lit frets, pulse ring).
- One soft key light plus rim light, fog into `--bg`. No textures or environment maps.
- Geometry: extruded body outline, box neck with fret bars, 6 strings with sine displacement in the vertex shader.

## Performance

- Canvas lazy-loaded after first paint; `frameloop="demand"` while idle, continuous only while playing or scrolling; DPR capped at 2; pauses when tab hidden or canvas off-screen.
- Poster image is the LCP element.
- Report added JS size against the "minimal client JS" budget during the build.

## Testing

- Vitest: camera keyframe interpolation (including skipped stops), widget-order -> route mapping, simulated driver timing/envelope/cleanup.
- React Testing Library: `HomeJourney` renders shows and merch as HTML without the canvas; empty states; Play button aria state; reduced-motion and no-WebGL fallbacks.
- Scene smoke test with mocked canvas; manual browser check with screenshots for visuals.
- Gates: `typecheck`, `lint`, `test`, `format:check`, `build`.

## Out of scope

Real audio, a GLB model, per-song sync, admin UI for the guitar.

## Open items

- Poster image: generated from a render of the scene (one-time script or screenshot) and committed to `public/`.
- i18n: new strings (Play/Pause, section labels) added to `src/i18n/translations.ts` for `en` and `af`.
