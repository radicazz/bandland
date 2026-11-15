# 3D Guitar Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page with a scroll journey around a pinned procedural 3D guitar that "plays" via a simulated signal, with release, shows and merch laid out along its anatomy.

**Architecture:** A server component (`HomeJourney`) renders all content as real HTML sections tagged `data-stop`. A client `PlaybackProvider` shares a `PlaybackSignal` between the Play button and a lazy-loaded react-three-fiber canvas pinned behind the sections. The camera is driven by the position of the `[data-stop]` sections, so text and camera stay aligned. Pure functions (route building, camera sampling, simulated driver) carry the logic and are unit tested.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind 4, `three`, `@react-three/fiber@^9`, Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-11-15-3d-guitar-home-design.md`

## Global Constraints

- Colors only via design tokens / CSS variables (`--bg --surface --surface-2 --border --text --text-muted --text-dim --highlight`); three.js materials read them from `getComputedStyle` at mount. No hardcoded hex.
- Red `--highlight` only for activity (pickups, lit frets, pulse ring).
- No `any` types; TypeScript strict.
- Canvas is decorative: `aria-hidden`, page fully usable without it.
- `prefers-reduced-motion`: no camera scrub; guitar stays at hero pose; Play only changes string glow.
- Canvas lazy-loaded (`next/dynamic`, `ssr: false`) after first paint; DPR capped at 2; `frameloop="demand"` while idle.
- New copy goes in `src/i18n/translations.ts` for both `en` and `af`.
- Conventional Commits; commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Gates before finishing: `npm run typecheck && npm run lint && npm test && npm run format:check && npm run build`.

## Review Focus

1. Every widget disabled, or no shows, or no merch: route and page still render, no crash, no empty gaps.
2. More upcoming shows than frets: lit-fret index clamps to the last fret.
3. Unmount or tab hidden while playing: all timers cleared, no state update after unmount.
4. WebGL unavailable or context lost: poster and plain page remain; Play still toggles.
5. Reduced-motion toggled at runtime: camera stops scrubbing and returns to hero pose.

## File Structure

- Create `src/components/guitar/playback.ts`: `PlaybackSignal`, `createSimulatedPlayback`.
- Create `src/components/guitar/PlaybackProvider.tsx`: client context + `usePlayback()`.
- Create `src/components/guitar/journey.ts`: `StopId`, `buildRoute`, `CAMERA_POSES`, `sampleCamera`.
- Create `src/components/guitar/guitarModel.ts`: `GuitarAnchors`, `proceduralAnchors`.
- Create `src/components/guitar/Guitar.tsx`: procedural mesh, reads `PlaybackSignal`.
- Create `src/components/guitar/GuitarStage.tsx`: lazy canvas wrapper with fallbacks.
- Create `src/components/guitar/useScrollProgress.ts`: section-aligned progress.
- Create `src/components/guitar/PlayButton.tsx`.
- Create `src/components/home/HomeJourney.tsx` (server) and replace `src/app/page.tsx` body.
- Modify `src/i18n/translations.ts`, `AGENTS.md`.
- Remove `src/components/HomeFeatures.tsx` and its test once `HomeJourney` replaces it.
- Create `public/guitar-poster.jpg`.

---

### Task 1: Dependencies and simulated playback

**Files:**

- Modify: `package.json`
- Create: `src/components/guitar/playback.ts`, `src/components/guitar/playback.test.ts`

**Interfaces:**

- Produces:

  ```ts
  export type PlaybackSignal = {
    readonly playing: boolean;
    readonly level: number; // 0..1, decaying envelope
    pluck(stringIndex: number): void;
    subscribe(listener: () => void): () => void;
    toggle(): void;
    dispose(): void;
  };
  export function createSimulatedPlayback(opts?: {
    bpm?: number;
    strings?: number;
  }): PlaybackSignal;
  ```

- [ ] **Step 1: Install** `npm i three @react-three/fiber@^9` and `npm i -D @types/three`. Record the versions.
- [ ] **Step 2: Write failing tests** with `vi.useFakeTimers()` in `playback.test.ts`:
  - `starts paused with level 0`
  - `toggle() starts playing and level rises above 0 after one beat (bpm 120 -> 500ms)`
  - `pluck listener fires once per beat with an index in [0, strings)` (use `subscribe` count)
  - `level decays toward 0 between beats`
  - `toggle() again pauses, and level reaches 0 with no further notifications`
  - `dispose() clears timers: advancing 10s after dispose triggers no listeners`
- [ ] **Step 3: Run** `npx vitest run src/components/guitar/playback.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 4: Implement** `createSimulatedPlayback` with a `setInterval` beat plus a decay tick; riff is a fixed 8-step array of string indexes. Default bpm 96, 6 strings.
- [ ] **Step 5: Run** the same command. Expected: PASS.
- [ ] **Step 6: Commit** `feat: add simulated playback signal`.

### Task 2: Route and camera sampling (pure)

**Files:**

- Create: `src/components/guitar/journey.ts`, `src/components/guitar/journey.test.ts`

**Interfaces:**

- Consumes: `WidgetSetting`, `WidgetId` from `@/content/schema`.
- Produces:

  ```ts
  export type StopId = "hero" | "release" | "neck" | "body" | "outro";
  export type CameraPose = { position: [number, number, number]; target: [number, number, number] };
  export const CAMERA_POSES: Record<StopId, CameraPose>;
  export function buildRoute(widgets: readonly WidgetSetting[]): StopId[];
  export function sampleCamera(route: readonly StopId[], position: number): CameraPose; // position in route-index units, clamped to [0, route.length-1]
  ```

- [ ] **Step 1: Write failing tests** in `journey.test.ts`:
  - `buildRoute with default widgets returns ["hero","release","neck","body","outro"]`
  - `widget order [merch,nextShow,release] returns hero, release, body, neck, outro` (release fixed at stop 2 when enabled; nextShow->neck, merch->body keep admin order)
  - `disabled widgets are skipped` (only `release` enabled -> `["hero","release","outro"]`)
  - `all widgets disabled -> ["hero","outro"]`
  - `sampleCamera at integer positions returns that stop's pose exactly`
  - `sampleCamera at 0.5 between two stops is the midpoint (ease(0.5) === 0.5)`
  - `sampleCamera clamps below 0 and above length-1`
- [ ] **Step 2: Run** `npx vitest run src/components/guitar/journey.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the signatures above. Use smoothstep easing. Pose values: choose per the spec's table (hero full/low, release near headstock, neck along +y, body wide, outro = hero).
- [ ] **Step 4: Run** it again. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add guitar journey route and camera sampling`.

### Task 3: Procedural guitar, anchors, stage

**Files:**

- Create: `guitarModel.ts`, `Guitar.tsx`, `GuitarStage.tsx`, `useScrollProgress.ts`, `PlaybackProvider.tsx`, `GuitarStage.test.tsx`, `useScrollProgress.test.ts` (all under `src/components/guitar/`)

**Interfaces:**

- Consumes: `PlaybackSignal`/`createSimulatedPlayback` (Task 1), `StopId`/`sampleCamera`/`CameraPose` (Task 2).
- Produces:

  ```ts
  // guitarModel.ts
  export type GuitarAnchors = {
    headstock: [number, number, number];
    soundHole: [number, number, number];
    fretCount: number;
    fretPosition(index: number): [number, number, number]; // clamps index to [0, fretCount-1]
  };
  export const proceduralAnchors: GuitarAnchors;

  // PlaybackProvider.tsx ("use client")
  export function PlaybackProvider(props: { children: React.ReactNode }): JSX.Element;
  export function usePlayback(): PlaybackSignal;

  // useScrollProgress.ts
  export function computeRoutePosition(centers: number[], viewportCenter: number): number; // pure: index units, interpolates between section centers, clamped
  export function useScrollProgress(route: readonly StopId[]): number; // reads [data-stop] elements

  // GuitarStage.tsx ("use client")
  export function GuitarStage(props: { route: readonly StopId[]; litFret: number }): JSX.Element;
  ```

- [ ] **Step 1: Write failing tests:**
  - `proceduralAnchors.fretPosition clamps index above fretCount-1 and below 0`
  - `computeRoutePosition returns 0 above first center, n-1 below last, 1.5 midway between centers 1 and 2`
  - `GuitarStage renders a poster <img alt=""> with aria-hidden wrapper and no canvas when matchMedia(prefers-reduced-motion) matches`
  - `GuitarStage renders the poster fallback when WebGL is unavailable` (stub `HTMLCanvasElement.prototype.getContext` to return null)
  - `PlaybackProvider disposes the signal on unmount` (spy on timers via fake timers; no listener calls after unmount)
- [ ] **Step 2: Run** `npx vitest run src/components/guitar`. Expected: FAIL.
- [ ] **Step 3: Implement** the files. `Guitar.tsx`: extruded body outline, box neck, fret bars from `proceduralAnchors`, 6 strings displaced by a sine whose amplitude uses `signal.level` and per-string pluck decay, pickups emissive `--highlight` scaled by `level`; pulse ring at headstock; body scale `1 + 0.02*level`; frets at `litFret` emissive. `GuitarStage` is the `next/dynamic` boundary: poster `<img src="/guitar-poster.jpg">` always rendered underneath; the `<Canvas frameloop="demand" dpr={[1,2]}>` mounts only if WebGL works and reduced-motion is off. Invalidate on scroll/signal change; pause on `document.hidden` and off-screen via `IntersectionObserver`. Read tokens once from `getComputedStyle(document.documentElement)`.
- [ ] **Step 4: Run** `npx vitest run src/components/guitar`. Expected: PASS (mock `@react-three/fiber` Canvas in the smoke test).
- [ ] **Step 5: Commit** `feat: add procedural guitar stage`.

### Task 4: i18n strings and Play button

**Files:**

- Modify: `src/i18n/translations.ts`
- Create: `src/components/guitar/PlayButton.tsx`, `src/components/guitar/PlayButton.test.tsx`

**Interfaces:**

- Consumes: `usePlayback` (Task 3).
- Produces: `home.journey: { play: string; pause: string; playHint: string; neckTitle: string; bodyTitle: string; outroTitle: string }` in `Translations`, filled for `en` and `af`; `PlayButton(props: { labels: Pick<Translations["home"]["journey"], "play" | "pause"> })`.

- [ ] **Step 1: Write failing test** `PlayButton.test.tsx`: renders a `button` named "Play" with `aria-pressed="false"`; clicking sets `aria-pressed="true"` and the name to "Pause"; clicking again resets it.
- [ ] **Step 2: Run** `npx vitest run src/components/guitar/PlayButton.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the type additions, both locales (Afrikaans: "Speel" / "Wag"), and `PlayButton` using `useSyncExternalStore` over `signal.subscribe`.
- [ ] **Step 4: Run** the test plus `npm run typecheck`. Expected: PASS, no type errors.
- [ ] **Step 5: Commit** `feat: add play button and journey copy`.

### Task 5: HomeJourney and home page

**Files:**

- Create: `src/components/home/HomeJourney.tsx`, `src/components/home/HomeJourney.test.tsx`
- Modify: `src/app/page.tsx`
- Remove: `src/components/HomeFeatures.tsx`, `src/components/HomeFeatures.test.tsx`, and `HeroSlideshow` usage on the home page (leave the component file if used elsewhere; check with grep, delete if unused)

**Interfaces:**

- Consumes: `buildRoute` (Task 2), `PlaybackProvider`, `GuitarStage`, `PlayButton`, `getShows`, `getMerchItems`, `splitShowsByStatus`, `formatShowDatePretty`, `getShowDateBlock`, `SiteSettings`.
- Produces: `HomeJourney(props: { labels: Translations; locale: Locale; settings: SiteSettings }): Promise<JSX.Element>`. Sections carry `data-stop="hero|release|neck|body|outro"` in route order.

- [ ] **Step 1: Write failing tests** (mock `@/content/shows` and `@/content/merch`, mock `GuitarStage` to a stub):
  - `renders sections in route order for default settings`
  - `shows the next show first with a ticket link, then following shows`
  - `renders the existing fallback copy when there are no upcoming shows`
  - `omits the body section when merch is empty or the merch widget is disabled`
  - `renders only hero and outro when all widgets are disabled`
  - `renders the release title and CTA href from settings.release`
  - `outro contains links to /shows and /merch`
- [ ] **Step 2: Run** `npx vitest run src/components/home`. Expected: FAIL.
- [ ] **Step 3: Implement** `HomeJourney`: move the next-show, release and merch markup from `HomeFeatures` into the neck, release and body sections (reuse `MerchCard`, `ShowCard` where they fit the visuals), compute `litFret` per show index, and pass the route to `GuitarStage`. Rewrite `page.tsx` to call `getSiteSettings` and render `HomeJourney`. Keep `-mt-16` header overlap behavior.
- [ ] **Step 4: Run** `npx vitest run`. Expected: all PASS.
- [ ] **Step 5: Commit** `feat: replace home with guitar scroll journey`.

### Task 6: Poster, verification, docs

**Files:**

- Create: `public/guitar-poster.jpg`
- Modify: `AGENTS.md`

- [ ] **Step 1: Run** `npm run dev`, open `/`, scroll the full journey at desktop and 390px widths, toggle Play, and toggle reduced motion in devtools. Capture screenshots; confirm each stop's content, fret lighting, and the red-only-on-activity rule.
- [ ] **Step 2: Capture the poster** from the hero pose (1600px wide, JPEG quality ~80) into `public/guitar-poster.jpg`.
- [ ] **Step 3: Run** the full gate: `npm run typecheck && npm run lint && npm test && npm run format:check && npm run build`. Expected: all pass.
- [ ] **Step 4: Record** the added first-load JS for `/` from the build output against the pre-change figure (`git stash` baseline or the previous build) and note it in the commit body.
- [ ] **Step 5: Update `AGENTS.md`**: Current Features, Component Architecture, Pages (`/` description), Tech Stack (three, r3f), Performance Budget note on the lazy canvas.
- [ ] **Step 6: Commit** `docs: document guitar home journey`.
