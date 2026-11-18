# Premium Stage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the home guitar read as a true (HH) Telecaster, give the stage lit-stage atmosphere that reacts to scroll and music, and add a persistent player bar (waveform, volume, seek, time) on all public pages, plus an intro reveal and section reveals.

**Architecture:** Telecaster geometry moves into a pure, testable data module consumed by `Guitar.tsx`. Large-area lighting is CSS on `.guitar-stage` driven by custom properties that `JourneyStage` (scroll) and a pulse hook (playback level) write; dust motes are one `Points` object in the r3f scene. `PlaybackProvider` moves to the root layout; `PlaybackSignal` grows volume/mute/seek/time/waveform members consumed by a new `PlayerBar`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Tailwind 4, three + @react-three/fiber, Vitest 3 + RTL.

**Spec:** `docs/superpowers/specs/2026-11-18-premium-stage-design.md`

## Global Constraints

- Colours only via design tokens (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--text-dim`, `--highlight`); translucency via `color-mix`; red only for live state.
- No new runtime dependencies; no postprocessing, no drei.
- `prefers-reduced-motion`: no drift, no reveal motion, `--pulse` stays 0, camera pinned (existing).
- Ambient motion only while scrolling or playing; on-demand render loop must still go idle when the page is still.
- No autoplay: nothing audible before a user gesture.
- WCAG AA; native `<button>` / `<input type="range">` with labels; focus 2px outline, 3px offset (existing global styles).
- Tabular numbers (`tabular-nums`) for times.
- Every `localStorage` / `sessionStorage` access wrapped in try/catch.
- No `any`. Conventional Commits, each ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Gate per task: `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`. `npm run build` in the final task.

## Review Focus

1. **Client navigation while playing** (`/` → `/shows` → `/`): music must not stop or restart, and the guitar must pick the live signal back up (red pickups lit) on return. Test in Task 4.
2. **Volume persisted as garbage** (`localStorage["bandland-volume"]` = `"abc"`, `"7"`, `"-1"`, or storage throws): player must start at a clamped, finite volume (default 0.8), never NaN. Test in Task 3.
3. **Seek before metadata** (`duration` NaN or `Infinity`): seek slider is disabled and `seek()` is a no-op, no exception. Test in Task 3 and Task 4.
4. **Reduced motion while playing**: `--pulse` stays 0, motes static, waveform static, intro and reveals skipped; content must be fully visible. Test in Tasks 6, 7 and 8.
5. **No JS / hydration failure**: section content and the hero must be visible (reveal hidden state only applies under a JS-set root class). Test in Task 8.

---

### Task 1: Telecaster geometry module

Move the outlines and string layout out of `Guitar.tsx` into a pure module, with the spec's corrected dimensions.

**Files:**

- Create: `src/components/guitar/telecaster.ts`
- Create: `src/components/guitar/telecaster.test.ts`
- Modify: `src/components/guitar/guitarModel.ts` (`GUITAR_DIMENSIONS`)
- Modify: `src/components/guitar/Guitar.tsx:176-285` (delete moved constants/functions, import them)

**Interfaces:**

- Produces (all from `telecaster.ts`):
  - `type Outline = ReadonlyArray<readonly [number, number]>`
  - `BODY_OUTLINE: Outline` — around (0, 0), local to `bodyCenterY`
  - `PICKGUARD_OUTLINE: Outline` — same frame as the body
  - `HEADSTOCK_OUTLINE: Outline` — from the nut (y = 0) upward
  - `CONTROL_PLATE: { x; y; angle; length; width }` (body-local)
  - `BODY_EDGE = 0.035` (bevel size/thickness, replaces `BODY_BEVEL`)
  - `HUMBUCKER_SIZE: { width: number; height: number }`, `BRIDGE_PLATE_SIZE: { width: number; height: number }`
  - `stringX(index: number, y: number): number`
  - `postPosition(index: number): [number, number]` (x, y on the headstock face; Guitar.tsx adds z)
  - `tunerButtonX(): number` (x of the tuner buttons, just off the bass edge)
  - `pointInOutline(outline: Outline, x: number, y: number): boolean` (even-odd ray cast; used by tests and motes)
- `GUITAR_DIMENSIONS` changes: `neckWidthAtNut: 0.31`, `neckWidthAtEnd: 0.41`. `bodyCenterY` and `neckBottomY` may change so the body's top edge at the neck meets the fretboard around fret 16 (`fretY(16)`); keep `scaleLength`, `nutY`, `totalFrets`.

- [ ] **Step 1: Write failing tests** in `telecaster.test.ts`:
  - `body is ≈2.40 wide and ≈2.96 long`: bounding box of `BODY_OUTLINE` width within 2.35–2.45, height within 2.90–3.02.
  - `body sides are nearly parallel`: the outline's max |x| for y in the lower half (y ∈ [-1.1, -0.3]) varies by < 0.08 on each side.
  - `treble horn is shorter than the bass shoulder`: max y of points with x > 0.3 is at least 0.2 lower than max y of points with x < -0.3.
  - `neck pocket meets the fretboard near fret 16`: the body top edge at x = 0 (body-local y + `bodyCenterY`) is within 0.12 of `fretY(16)`.
  - `strings fan within the neck`: for every string, `|stringX(i, nutY)| < neckWidthAtNut/2 - 0.02` and `|stringX(i, fretY(22))| < neckWidthAt(fretY(22))/2 - 0.02`.
  - `strings sit inside the humbuckers and bridge plate`: `|stringX(0|5, y)| + 0.03 < HUMBUCKER_SIZE.width/2` at both pickup Ys, same for `BRIDGE_PLATE_SIZE` at `BRIDGE_Y`.
  - `headstock is ≈0.55 wide`: bounding width of `HEADSTOCK_OUTLINE` within 0.5–0.6; wider than `neckWidthAtNut`.
  - `tuner posts sit on the headstock and buttons hug the bass edge`: every `postPosition(i)` passes `pointInOutline(HEADSTOCK_OUTLINE, x, y - nutY)`; `tunerButtonX()` is within 0.08 of the outline's min x and below it.
  - `pickguard stays inside the body`: every `PICKGUARD_OUTLINE` point passes `pointInOutline(BODY_OUTLINE, …)`.
  - `control plate ends stay inside the body`: both plate ends (centre ± length/2 along `angle`) inside `BODY_OUTLINE`.

- [ ] **Step 2: Run** `npx vitest run src/components/guitar/telecaster.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement `telecaster.ts`** and update `GUITAR_DIMENSIONS`. Author `BODY_OUTLINE` (Catmull-Rom smoothed by the existing `smoothShape`, so 30–40 control points): single rounded bass shoulder (top-left), short pointed treble horn (top-right), deep tight cutaway between horn and neck pocket, flat pocket run across the top at the neck width, near-parallel sides, squarish lower bout with ≈0.35 corner radii. Headstock: straight bass edge carrying six tuners, curved treble bulge widening toward a rounded tip. In `Guitar.tsx`, import everything and delete the local copies; switch `BODY_BEVEL` to `BODY_EDGE`; size humbucker/bridge geometry from `HUMBUCKER_SIZE`/`BRIDGE_PLATE_SIZE`; tuner buttons and their shafts use `tunerButtonX()`.

- [ ] **Step 4: Run** `npx vitest run src/components/guitar` → PASS (including existing `guitarModel.test.ts`, `GuitarStage.test.tsx`).

- [ ] **Step 5: Commit** `refactor: move telecaster geometry into a tested module with true proportions`.

### Task 2: Render check, framing and poster

**Files:**

- Modify: `src/components/guitar/Guitar.tsx` (fret wire/inlay/nut sizing, string tree, wordmark position)
- Modify: `src/components/guitar/journey.ts` (`CAMERA_POSES` only if framing breaks)
- Modify: `public/guitar-poster.webp`

**Interfaces:** Consumes Task 1 exports. Produces nothing new.

- [ ] **Step 1: Visual check.** `npm run dev`, open `/` at 390×844 and 1440×900. Confirm: whole guitar fits at hero/outro; release stop frames the headstock; neck stop shows the lit fret; body stop frames both humbuckers and control plate; fret wires, nut and inlays span the wider neck; string tree and wordmark sit on the wider headstock; tuner buttons touch their posts.
- [ ] **Step 2: Fix** whatever Step 1 shows (sizes derived from `neckWidthAt`; camera poses nudged minimally). Re-run `npx vitest run src/components/guitar/journey.test.ts`.
- [ ] **Step 3: Re-render the poster.** With a throwaway Playwright script in the scratchpad (not committed): viewport 380×1000, `deviceScaleFactor: 2`, `reducedMotion: "reduce"` (pins the hero pose), inject CSS `.guitar-stage{background:none!important}.guitar-stage::before,.guitar-stage-vignette,.journey-scrim,.guitar-stage img{display:none!important}` plus hiding the section text, wait for the canvas's first frame, screenshot the canvas element with `omitBackground: true`, convert to WebP (q≈85) at 760×2000 into `public/guitar-poster.webp`. Confirm transparency and that it lines up with the live canvas at the hero pose (toggle the poster on in devtools).
- [ ] **Step 4: Run** the gate.
- [ ] **Step 5: Commit** `feat: true-proportion telecaster with re-rendered poster`.

### Task 3: Playback API: volume, mute, seek, time, waveform

**Files:**

- Modify: `src/components/guitar/playback.ts`
- Modify: `src/components/guitar/PlaybackProvider.tsx` (host facade forwards new members)
- Test: `src/components/guitar/playback.test.ts`, `src/components/guitar/GuitarStage.test.tsx` (PlaybackProvider block)

**Interfaces:**

- Produces on `PlaybackSignal` (exact names):
  ```ts
  readonly volume: number;      // 0..1, default 0.8
  readonly muted: boolean;
  readonly currentTime: number; // seconds, 0 before load
  readonly duration: number;    // seconds; NaN until known
  readonly started: boolean;    // true once toggle() has started playback at least once
  setVolume(value: number): void; // non-finite ignored; clamps to [0,1]; unmutes when > 0
  toggleMute(): void;
  seek(seconds: number): void;    // no-op unless duration is finite; clamps to [0, duration]
  readWaveform(target: Uint8Array): boolean; // time-domain bytes; false without analyser
  ```
- Produces: `export const VOLUME_STORAGE_KEY = "bandland-volume"`; stored JSON `{ volume: number; muted: boolean }`.
- Produces: `export function readStoredVolume(): { volume: number; muted: boolean }` (defaults `{ volume: 0.8, muted: false }` on missing/invalid/throwing storage).

- [ ] **Step 1: Write failing tests** in `playback.test.ts`:
  - `readStoredVolume falls back to 0.8 for missing, malformed, out-of-range and throwing storage` — cases `null`, `"abc"`, `'{"volume":7}'` → `volume` 1, `'{"volume":-1}'` → 0, `getItem` throws → default.
  - simulated: `setVolume clamps and ignores NaN`, `toggleMute flips muted and notifies`, `started becomes true on first toggle and stays true after pause`, `readWaveform returns false`.
  - audio (FakeAudio, `AudioContext` undefined): `volume and mute go to the element` (`element.volume === 0.5` after `setVolume(0.5)`; `element.muted` after `toggleMute()`); `setVolume persists to localStorage`; `seek is a no-op while duration is NaN and clamps once known` (emit `durationchange` with `duration = 200`; `seek(500)` → `currentTime 200`; `seek(-3)` → 0); `timeupdate and durationchange notify subscribers`; `readWaveform returns false without an analyser`.
  - audio with a fake `AudioContext` (stub `createMediaElementSource`, `createAnalyser` with `getByteTimeDomainData` filling 128, `createGain` with `gain.value`): `volume goes through the gain node, analyser stays pre-gain` (assert connect order source→analyser→gain→destination and `gain.value === 0.5`, `element.volume` untouched); `readWaveform fills the buffer and returns true`.
  - `GuitarStage.test.tsx`: `PlaybackProvider forwards volume, seek and waveform to the driver`.
- [ ] **Step 2: Run** `npx vitest run src/components/guitar/playback.test.ts` → FAIL.
- [ ] **Step 3: Implement.** Audio driver: read stored volume at creation; apply on `ensureAudio` (gain node when the context exists, else `element.volume`/`element.muted`); `getByteTimeDomainData` for `readWaveform`; listen to `timeupdate`, `durationchange`, `loadedmetadata` and notify; persist on every volume/mute change. Simulated driver: in-memory equivalents, `duration` NaN, `currentTime` 0. Host facade: forward getters and methods; defaults when no driver (`volume` from `readStoredVolume()`, `duration` NaN, `started` false, `readWaveform` false).
- [ ] **Step 4: Run** the gate → PASS.
- [ ] **Step 5: Commit** `feat: volume, mute, seek and waveform on playback`.

### Task 4: Provider in the root layout and the player bar

**Files:**

- Create: `src/components/player/PlayerBar.tsx`, `src/components/player/Waveform.tsx`, `src/components/player/PlayerBar.test.tsx`
- Create: `src/components/player/formatTime.ts` (+ cases in `PlayerBar.test.tsx`)
- Modify: `src/app/layout.tsx` (wrap the page in `PlaybackProvider`, render `<PlayerBar labels={labels.player} />` after the footer)
- Modify: `src/components/home/HomeJourney.tsx:242,263` (remove its `PlaybackProvider`)
- Modify: `src/i18n/translations.ts` (new `player` block, en + af)
- Modify: `src/app/globals.css` (`.player-bar` surface: translucent `--surface` + `backdrop-filter: blur(16px)`; body bottom padding var `--player-clear`)
- Modify: `HomeJourney.test.tsx`, `JourneyStage.test.tsx`, `GuitarStage.test.tsx` to wrap renders in `PlaybackProvider` where needed.

**Interfaces:**

- Consumes: Task 3 `PlaybackSignal` members; `usePlayback()`.
- Produces: `Translations["player"]` = `{ region: string; play: string; pause: string; mute: string; unmute: string; volume: string; seek: string; close: string; position: string /* "{current} of {total}" */ }`.
  - en: `"Music player"`, `"Play"`, `"Pause"`, `"Mute"`, `"Unmute"`, `"Volume"`, `"Seek"`, `"Close player"`, `"{current} of {total}"`.
  - af: `"Musiekspeler"`, `"Speel"`, `"Pouse"`, `"Demp"`, `"Ontdemp"`, `"Volume"`, `"Soek"`, `"Maak speler toe"`, `"{current} van {total}"`.
- Produces: `formatTime(seconds: number): string` → `"0:00"` for non-finite/negative, `"3:07"`, `"61:01"`.
- Produces: `PlayerBar({ labels }: { labels: Translations["player"] })`; `Waveform({ signal, active }: { signal: PlaybackSignal; active: boolean })`.

- [ ] **Step 1: Write failing tests** in `PlayerBar.test.tsx` (render inside `PlaybackProvider createDriver={() => createSimulatedPlayback()}`; mock `next/navigation` `usePathname`):
  - `renders nothing before playback has started`.
  - `appears after the first toggle as a labelled region` (`getByRole("region", { name: "Music player" })`).
  - `play/pause button toggles the signal and its label`.
  - `mute button flips aria-pressed and label`; `volume slider calls setVolume with the slider value / 100`.
  - `seek slider is disabled while duration is unknown` and `has aria-valuetext "0:00 of 0:00"` style text from `position`.
  - `close pauses playback and hides the bar`; the bar reappears on the next play.
  - `renders nothing on /admin routes`.
  - `formatTime` cases above.
  - `HomeJourney.test.tsx`: `keeps the live signal across a remount` — one provider, unmount/remount `JourneyStage` under it, `signal.playing` still true (Review Focus 1).
- [ ] **Step 2: Run** `npx vitest run src/components/player` → FAIL.
- [ ] **Step 3: Implement.** `PlayerBar`: `useSyncExternalStore` on the signal; `usePathname()?.startsWith("/admin")` → `null`; local `dismissed` state reset when `playing` turns true. Layout: fixed bottom, `player-bar` class, `border-t border-border`, `rounded-none`, `px-4 sm:px-6`, inside `Container`. Order: play/pause, title (`site.featuredTrack.title`, truncate), `Waveform`, seek (`input type=range` 0..duration step 0.1, `disabled` when `!Number.isFinite(duration)`, `aria-valuetext` from `position`), time `tabular-nums text-text-dim`, mute button (`aria-pressed`), volume range 0–100 (`hidden sm:block`), close. Below `sm`: seek collapses to a thin range above the row. While the bar is shown, set `document.body.style.setProperty("--player-clear", "<bar height>px")` via ResizeObserver and clear on hide; footer gets `pb-[var(--player-clear,0px)]`. `Waveform`: 2D canvas (DPR ≤ 2), rAF only while `active && !reducedMotion`; oscilloscope line from `readWaveform` into a reused `Uint8Array(1024)`; stroke `--highlight` while playing, else `--text-dim`; when `readWaveform` returns false or reduced motion, draw a static 32-bar silhouette once. Colours read from `getComputedStyle(document.documentElement)`.
- [ ] **Step 4: Run** the gate → PASS. Manual check: play on `/`, navigate to `/shows` and back — track continues, guitar lights up on return; keyboard through every control.
- [ ] **Step 5: Commit** `feat: persistent player bar with waveform, volume and seek`.

### Task 5: Per-stop light poses

**Files:**

- Modify: `src/components/guitar/journey.ts`
- Test: `src/components/guitar/journey.test.ts`

**Interfaces:**

- Produces: `type LightPose = { x: number; y: number; size: number }` (percent of the stage, x relative to the guitar centre: 0 = centre; size = ellipse width %).
- Produces: `LIGHT_POSES: Record<StopId, LightPose>` — hero `{x:0,y:38,size:55}`, release `{x:-4,y:18,size:38}`, neck `{x:2,y:40,size:32}`, body `{x:0,y:62,size:48}`, outro `{x:0,y:40,size:60}`.
- Produces: `sampleLight(route: readonly StopId[], position: number): LightPose` — same clamping and `smoothstep` as `sampleCamera`, no arc.

- [ ] **Step 1: Write failing tests:** `every stop has a light pose`; `sampleLight returns the stop pose exactly at integer positions`; `sampleLight blends monotonically between hero and release` (x, y, size between the two at 0.25/0.5/0.75); `sampleLight clamps outside the route and handles an empty route` (→ hero).
- [ ] **Step 2: Run** `npx vitest run src/components/guitar/journey.test.ts` → FAIL.
- [ ] **Step 3: Implement** (share a scalar `lerp` + existing `smoothstep`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: per-stop light poses for the stage`.

### Task 6: Stage atmosphere (spotlight, haze, per-stop light, pulse)

**Files:**

- Create: `src/components/guitar/useStagePulse.ts`, `src/components/guitar/useStagePulse.test.ts`
- Modify: `src/components/guitar/GuitarStage.tsx` (accept `light: LightPose`, `hazeShift: number`; write CSS vars; add spotlight + haze layers; call `useStagePulse`)
- Modify: `src/components/home/JourneyStage.tsx` (compute `sampleLight(route, position)`, pass it; `hazeShift = position`)
- Modify: `src/app/globals.css` (`.guitar-stage` layers)
- Test: `src/components/guitar/GuitarStage.test.tsx`

**Interfaces:**

- Consumes: Task 5 `sampleLight`, `LightPose`.
- Produces: `useStagePulse(ref: RefObject<HTMLElement | null>, signal: PlaybackSignal, reducedMotion: boolean): void` — while `signal.playing && !reducedMotion`, a rAF loop sets `--pulse` to `signal.level.toFixed(3)` on `ref.current`; otherwise sets `--pulse: 0` and runs no loop.
- CSS variables on `.guitar-stage`: `--light-x` (`calc(var(--stage-x) + <x>%)`), `--light-y`, `--light-size`, `--pulse`, `--haze-shift`.

- [ ] **Step 1: Write failing tests:**
  - `useStagePulse.test.ts` (fake rAF via `vi.stubGlobal`): `writes the signal level while playing`; `writes 0 and cancels the frame when playback stops`; `never starts a loop under reduced motion`.
  - `GuitarStage.test.tsx`: `writes light variables from the light prop` (`style` has `--light-y: 62%` for body pose); `renders spotlight and haze layers as aria-hidden decoration`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** CSS, all colours from tokens:
  - Light pool: existing first radial gradient now at `var(--light-x) var(--light-y)` sized `var(--light-size)`, alpha `calc(7% + 6% * var(--pulse, 0))` via `color-mix`.
  - `.guitar-stage-spot`: overhead cone — `linear-gradient(to bottom, color-mix(in srgb, var(--text) 9%, transparent), transparent 75%)` masked by a `conic-gradient` wedge (apex above the top edge at `--light-x`, ≈28° spread) and blurred edges; opacity `calc(0.6 + 0.4 * var(--pulse, 0))`.
  - `.guitar-stage-haze`: grayscale `feTurbulence` SVG (baseFrequency ≈ .012, 3 octaves), `background-size: 900px 900px`, `background-position: calc(var(--haze-shift, 0) * -120px) calc(var(--haze-shift, 0) * 60px)`, `mix-blend-mode: screen`, opacity `calc(0.08 + 0.06 * var(--pulse, 0))`, masked to the cone region.
  - Red spill `[data-playing]::before` opacity `calc(0.6 + 0.4 * var(--pulse, 0))`.
  - Transitions on `--light-*` are not used (values already follow eased scroll); reduced motion: `--haze-shift` forced 0 via `@media (prefers-reduced-motion: reduce) { .guitar-stage { --haze-shift: 0 !important } }`.
  - Layer order inside `.guitar-stage`: backdrop (element bg) → spot → haze → poster/canvas → vignette/grain.
- [ ] **Step 4: Run** the gate → PASS. Visual check: light moves between stops on scroll; haze shifts only while scrolling; pulse visible while playing; static when idle; reduced motion static.
- [ ] **Step 5: Commit** `feat: spotlight, haze and music-reactive stage lighting`.

### Task 7: Dust motes in the scene

**Files:**

- Create: `src/components/guitar/motes.ts`, `src/components/guitar/motes.test.ts`
- Modify: `src/components/guitar/Guitar.tsx` (`Motes` component inside `GuitarCanvas`, outside `SwayRig`)

**Interfaces:**

- Produces (`motes.ts`, pure):
  - `createMoteField(count: number, seed: number): Float32Array` — xyz triples inside the cone volume: x ∈ [-2.2, 2.2] scaled by height, y ∈ [-3.6, 3.6], z ∈ [-1.5, 2.5]; deterministic PRNG (mulberry32).
  - `stepMotes(positions: Float32Array, base: Float32Array, time: number, energy: number): void` — offsets each point from `base` by small sinusoidal drift with amplitude ∝ `energy` (0 → positions equal base), wraps nothing.
  - `MOTE_COUNT = { phone: 150, desktop: 300 }`.
- `Motes({ signal, motion, reducedMotion, palette })`: `Points` + `PointsMaterial` (`size` ≈ 0.035, `sizeAttenuation`, `map` = existing `glowTexture()`, `transparent`, `depthWrite: false`, `AdditiveBlending`, `color` = `palette.text`, `opacity` 0.35). `energy = |motion.velocity| * k + signal.level`; drift time advances only while `energy > 0.001`; calls `invalidate()` only while energy is non-zero (so demand mode idles). Count from `window.matchMedia("(min-width: 768px)")`.

- [ ] **Step 1: Write failing tests:** `createMoteField is deterministic for a seed and has count*3 values`; `all motes lie inside the volume`; `stepMotes with zero energy leaves positions equal to base`; `stepMotes displacement grows with energy and stays under 0.15`.
- [ ] **Step 2: Run** `npx vitest run src/components/guitar/motes.test.ts` → FAIL.
- [ ] **Step 3: Implement** `motes.ts` and the `Motes` component; reduced motion → energy forced 0.
- [ ] **Step 4: Run** the gate → PASS. Visual check: motes catch light, drift while scrolling/playing, freeze when idle (Performance panel shows no frames when idle).
- [ ] **Step 5: Commit** `feat: dust motes drifting in the stage light`.

### Task 8: Intro reveal and section reveals

**Files:**

- Create: `src/app/bootScript.ts`, `src/components/Reveal.tsx`, `src/components/Reveal.test.tsx`, `src/components/IntroSeen.tsx`
- Modify: `src/app/layout.tsx` (inline `<script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />` in `<head>`; render `<IntroSeen />`)
- Modify: `src/components/home/HomeJourney.tsx` (wrap each stop's kicker/heading/content in `Reveal`; add `.stage-intro` overlay inside the sticky stage; `intro-wordmark` class on the hero wordmark)
- Modify: `src/app/globals.css`

**Interfaces:**

- Produces: `BOOT_SCRIPT: string` — sets `document.documentElement.classList.add("js")`; if `sessionStorage.getItem("bandland-intro") === "1"` (try/catch) adds `intro-seen`.
- Produces: `IntroSeen()` client component — on mount sets `sessionStorage["bandland-intro"] = "1"` (try/catch); renders null.
- Produces: `Reveal({ children, as?: "div" | "li", className? })` — client; IntersectionObserver (threshold 0.15, once) sets `data-revealed=""`; without IntersectionObserver sets it immediately.
- CSS:
  - `.stage-intro`: absolute inset-0 `bg-bg`, `animation: intro-lift 1.2s ease-out 0.15s both` (opacity 1 → 0), `pointer-events: none`. The poster underneath stays painted (LCP unaffected).
  - `.intro-wordmark`: `animation: intro-rise 0.9s ease-out 0.6s both` (opacity 0→1, translateY 12px→0).
  - `:root.intro-seen .stage-intro { display: none }`, `:root.intro-seen .intro-wordmark { animation: none }`.
  - `:root.js [data-reveal]:not([data-revealed])` → `opacity: 0; transform: translateY(12px)`; `[data-reveal]` transition `opacity 700ms ease, transform 700ms ease`.
  - Reduced motion: no animations, `[data-reveal]` always visible, `.stage-intro` hidden.

- [ ] **Step 1: Write failing tests** in `Reveal.test.tsx`: `renders children visible without the js root class` (no `js` class → computed opacity not set; assert `data-reveal` present and content in document); `marks itself revealed when intersecting` (stub IntersectionObserver, fire entry); `marks revealed immediately without IntersectionObserver`; `disconnects after revealing`. Add to `HomeJourney.test.tsx`: `hero wordmark and every stop heading are rendered in the server HTML` (Review Focus 5).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the gate → PASS. Manual: first load fades up from black; reload in the same tab skips it; new tab plays it again; reduced motion shows everything instantly; JS disabled shows all content.
- [ ] **Step 5: Commit** `feat: intro reveal and scroll reveals`.

### Task 9: Docs and final verification

**Files:**

- Modify: `AGENTS.md` (Current Features: Telecaster proportions, player bar on all public pages and persisting across navigation, stage lighting variables/haze/motes/pulse, intro + reveals; Component Architecture: `player/PlayerBar`, `player/Waveform`, `Reveal`, `guitar/telecaster`, `guitar/motes`, `guitar/useStagePulse`; Motion Principles: haze/motes drift only while scrolling or playing, one-shot intro per session; Performance Budget: re-measure the canvas chunk gzip size from `npm run build` and update the number)

- [ ] **Step 1: Run** `npm test && npm run typecheck && npm run lint && npm run format:check && npm run build`. Expected: all pass; note the `/` canvas chunk size.
- [ ] **Step 2: Final browser pass** at 390×844 and 1440×900: full journey, play → navigate → return, reduced motion, keyboard-only through the player, axe/Lighthouse accessibility ≥ previous.
- [ ] **Step 3: Update `AGENTS.md`** per the list above.
- [ ] **Step 4: Commit** `docs: describe the telecaster, stage atmosphere and player bar`.
