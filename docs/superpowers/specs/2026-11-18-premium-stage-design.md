# Premium stage: Telecaster model, stage atmosphere, player bar

Date: 2026-11-18
Status: approved in conversation, pending spec review

## Intent

Make the band landing page feel complete and premium:

1. The 3D guitar should read unmistakably as a Telecaster.
2. The stage backdrop should feel like a lit stage (light, haze, motes) and react to the music.
3. The music player should be a real player: live waveform, volume, seek, time.
4. Light polish: an intro reveal and section reveals.

### Decisions made with the user

- **No autoplay.** "Autoplayer" means a persistent player bar that appears once Play is pressed. Nothing plays before a user gesture; the AGENTS.md rule "No auto-playing animations or audio" stays.
- **Keep the HH layout** (two humbuckers, hardtail plate); fix proportions and silhouette only.
- **Background effects:** all four — audio-reactive glow, spotlight + haze, dust motes, per-stop lighting.
- **Polish:** intro reveal, section text reveals, and the player on all public pages.
- **Approach A (hybrid):** large-area lighting in CSS (shared by poster and canvas), dust motes in the r3f scene.

### Constraints (from AGENTS.md)

- Colours only via design tokens; monochrome plus the single `--highlight` accent; red only for live state.
- WCAG AA minimum; semantic, keyboard-operable controls.
- `prefers-reduced-motion`: no drift, no reveal motion, camera pinned (already).
- Ambient motion only while scrolling or playing; the stage settles when the page is still. The render loop stays on demand.
- Minimal client JS; no new runtime dependencies. No postprocessing, no drei.

## §1 Telecaster model (HH kept)

Scale reference: `scaleLength` 4.8 units = 648 mm, so 1 unit ≈ 135 mm. Re-derive dimensions in `src/components/guitar/guitarModel.ts` (`GUITAR_DIMENSIONS`) and outlines in `Guitar.tsx`:

| Part             | Current    | Target                                                                   |
| ---------------- | ---------- | ------------------------------------------------------------------------ |
| Nut width        | 0.21       | 0.31 (≈42 mm)                                                            |
| Neck width, heel | 0.28       | 0.41 (≈56 mm)                                                            |
| Body width       | 2.36       | 2.40 (≈325 mm), flatter near-parallel sides                              |
| Body length      | ≈3.0       | 2.96 (≈400 mm); top edge meets the neck around fret 16                   |
| Body edge        | 0.06 bevel | ≈0.035, crisp slab edge                                                  |
| Headstock width  | ≈0.37      | ≈0.55, Tele profile: straight bass edge with tuners, curved treble bulge |

- New `BODY_OUTLINE`: single rounded bass shoulder, short pointed treble horn, deeper and tighter cutaway, squarish lower bout with ≈0.35 corner radii.
- `PICKGUARD_OUTLINE` re-traced to the new body; still wraps both humbuckers and stops short of the bridge plate and control plate.
- Control plate runs parallel to the lower treble edge.
- Tuner buttons sit just off the bass edge of the headstock, attached to their posts (no floating gap).
- Strings fan from the wider nut; string spacing, fret wire length, inlays and pickup pole positions all follow `neckWidthAt` / `stringX`.
- Humbucker and bridge plate widths scale so the strings sit inside them.
- `HEADSTOCK_OUTLINE`, string tree and wordmark repositioned for the wider headstock.
- Retune camera poses in `journey.ts` only if framing breaks; keep `STAGE_SHIFT` behaviour.
- Re-render `public/guitar-poster.webp` from the hero pose afterwards (transparent, portrait, narrower than any phone).

## §2 Stage atmosphere

All CSS layers live on `.guitar-stage` in `globals.css` so the poster and the canvas share them. Driven by CSS custom properties:

- `--light-x`, `--light-y`, `--light-size`: position/size of the light pool and spotlight cone.
- `--pulse` (0..1): audio-reactive intensity.
- `--haze-shift`: haze offset from scroll.

### Spotlight + haze

- A soft overhead cone (conic/linear gradient masked radially) falling onto the guitar, built from `--text` at low alpha.
- One grayscale fractal-noise haze layer (inline SVG data URI like the existing grain), low opacity, `mix-blend-mode: screen`.
- Haze moves only from `--haze-shift` (scroll) and `--pulse` (playing). No CSS keyframe drift.

### Per-stop lighting

- Each stop in `journey.ts` gets `light: { x: number; y: number; size: number }` (in stage-relative percentages).
- `JourneyStage` blends between stop lights with the same progress interpolation as the camera, writing the variables in its existing scroll handling (no extra loop).
- md+ follows `STAGE_SHIFT` (x is offset the same way as `--stage-x` today).

### Audio-reactive glow

- A rAF loop that runs only while `signal.playing` writes `--pulse` from `signal.level` onto the stage element; on stop it writes 0 and ends.
- `--pulse` raises the light-pool brightness and the red floor spill (`[data-playing]::before`) opacity.
- Reduced motion: `--pulse` stays 0 (the static red spill under `[data-playing]` still indicates state).

### Dust motes

- One `Points` object in the r3f scene: ≈300 points on md+, ≈150 on phones, distributed inside the cone volume around the guitar.
- Soft round sprite (canvas texture like `glowTexture`), colour from the `--text` token via the palette, additive blending, low opacity.
- Drift speed from scroll velocity (`SceneMotion`) plus `signal.level`; they freeze when both are idle, so on-demand rendering still stops.
- Reduced motion: points render static.

## §3 Player bar (all public pages)

### Provider

- `PlaybackProvider` moves from the home page into the root layout (`src/app/layout.tsx`), wrapping public content. Admin routes do not render the player bar.
- Playback persists across client-side navigation; a full reload resets it.
- Update the AGENTS.md line "stops when the reader leaves `/`" accordingly.

### `PlaybackSignal` additions (`playback.ts`)

```ts
readonly volume: number;      // 0..1
readonly muted: boolean;
readonly currentTime: number; // seconds
readonly duration: number;    // seconds, NaN until known
readonly started: boolean;    // true once Play has ever been pressed
setVolume(value: number): void; // clamps to 0..1
toggleMute(): void;
seek(seconds: number): void;   // clamps to [0, duration]
readWaveform(target: Uint8Array): boolean; // fills time-domain data; false when no analyser
```

- Volume through a `GainNode` between the analyser and destination when Web Audio is available; otherwise `HTMLAudioElement.volume`. The analyser reads pre-gain so the waveform does not shrink with volume.
- Volume and mute persisted in `localStorage` (`bandland-volume`), every access wrapped in try/catch.
- `timeupdate` / `durationchange` / `volumechange` notify subscribers (throttled to the element's own event rate).
- `createSimulatedPlayback` and the `PlaybackHost` facade implement the same members (simulated: in-memory values, `readWaveform` returns false).

### `PlayerBar` component (`src/components/player/PlayerBar.tsx`)

- Client component rendered by the root layout. Hidden until `started`; then a fixed, translucent bottom bar (`bg-surface` with backdrop blur, `border-border` top), dismissible with a close button (pausing the track).
- Contents, left to right: Play/Pause button, track title, waveform canvas, seek slider with `currentTime / duration` in tabular numbers, mute button and volume slider, close.
- Waveform: small 2D canvas, drawn in a rAF loop that runs only while playing; oscilloscope line from `readWaveform`, in `--text`, the accent `--highlight` for the line while playing. Without an analyser, a static bar silhouette.
- Controls are native `<button>` and `<input type="range">` with labels, `aria-valuetext` for time; keyboard operable; focus styles per AGENTS.md.
- Phones: compact layout (play, title, waveform, mute; volume slider hidden since phones use hardware volume; seek as a thin bar above).
- Page bottom padding so the bar never covers the footer.
- Reduced motion: waveform draws a static silhouette.

### Home

- The hero `PlayButton` and the status line stay; they drive the same signal.

### I18n

- New strings in `translations.ts` (en/af) for: player region label, play, pause, mute, unmute, volume, seek, close player.

## §4 Polish

### Intro reveal

- First load per session (`sessionStorage` flag, try/catch): the stage fades up from black over ≈1.2 s, light first, then the guitar (poster/canvas), then the hero wordmark.
- Opacity only; the poster remains the LCP image and is present in the DOM from the start.
- Skipped under reduced motion and when the flag is set; without JS, content shows immediately.

### Section reveals

- `Reveal` client wrapper: IntersectionObserver adds `data-revealed` once; CSS handles a slow fade + 12px rise.
- Content is visible without JS (the hidden state is applied only after hydration via a root class) and under reduced motion.

## Testing

- `playback.test.ts`: volume clamp and persistence, mute, seek clamp, `readWaveform` with and without analyser, fallback to element volume.
- `PlayerBar.test.tsx`: hidden before start, controls labelled, play/pause/mute/volume/seek call the signal, close pauses.
- `journey.test.ts`: every stop has a light pose; interpolation stays within bounds.
- `guitarModel.test.ts`: nut and heel widths, strings inside the humbuckers and bridge plate, neck end inside the body outline.
- Existing `GuitarStage`, `HomeJourney`, `JourneyStage`, `PlayButton` tests keep passing (provider moved).
- Visual check in the browser at phone and desktop widths, with and without reduced motion.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`.

## Build order

Each step is a separate commit and leaves the site working:

1. Telecaster model + poster re-render.
2. Playback API additions, provider move, `PlayerBar`.
3. Stage atmosphere (light variables, spotlight/haze, per-stop lights, pulse, motes).
4. Polish (intro reveal, section reveals) and AGENTS.md updates.

## Out of scope

- Multiple tracks / playlists, autoplay, postprocessing, new dependencies, changes to `/admin`.
