/**
 * paused: idle or stopped. loading: Play was pressed and the track is buffering.
 * playing: audible. error: the track could not be loaded or played.
 */
export type PlaybackStatus = "paused" | "loading" | "playing" | "error";

export type PlaybackSignal = {
  /** True while Play is engaged (loading or audible). */
  readonly playing: boolean;
  readonly status: PlaybackStatus;
  readonly level: number; // 0..1, decaying envelope
  pluck(stringIndex: number): void;
  subscribe(listener: () => void): () => void;
  toggle(): void;
  dispose(): void;
};

// Fixed 8-step riff expressed as string indexes.
const RIFF: readonly number[] = [0, 2, 3, 2, 0, 4, 3, 1];
const DEFAULT_BPM = 96;
const DEFAULT_STRINGS = 6;
const DECAY_TICK_MS = 50;
const DECAY_PER_TICK = 0.88;
const LEVEL_FLOOR = 0.001;

export function createSimulatedPlayback(
  opts: { bpm?: number; strings?: number } = {},
): PlaybackSignal {
  const beatMs = 60_000 / (opts.bpm ?? DEFAULT_BPM);
  const strings = Math.max(1, Math.floor(opts.strings ?? DEFAULT_STRINGS));

  const listeners = new Set<() => void>();
  let playing = false;
  let level = 0;
  let step = 0;
  let disposed = false;
  let beatTimer: ReturnType<typeof setInterval> | undefined;
  let decayTimer: ReturnType<typeof setInterval> | undefined;

  function notify(): void {
    for (const listener of [...listeners]) listener();
  }

  function stopDecay(): void {
    if (decayTimer !== undefined) {
      clearInterval(decayTimer);
      decayTimer = undefined;
    }
  }

  function decayTick(): void {
    level *= DECAY_PER_TICK;
    if (level < LEVEL_FLOOR) {
      level = 0;
      stopDecay();
    }
  }

  function startDecay(): void {
    if (decayTimer === undefined) {
      decayTimer = setInterval(decayTick, DECAY_TICK_MS);
    }
  }

  function pluck(stringIndex: number): void {
    if (disposed || !Number.isInteger(stringIndex) || stringIndex < 0 || stringIndex >= strings) {
      return;
    }
    level = 1;
    startDecay();
    notify();
  }

  function beat(): void {
    const riffIndex = RIFF[step % RIFF.length] ?? 0;
    step += 1;
    pluck(riffIndex % strings);
  }

  return {
    get playing() {
      return playing;
    },
    get status(): PlaybackStatus {
      return playing ? "playing" : "paused";
    },
    get level() {
      return level;
    },
    pluck,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    toggle(): void {
      if (disposed) return;
      playing = !playing;
      if (playing) {
        beatTimer = setInterval(beat, beatMs);
      } else if (beatTimer !== undefined) {
        clearInterval(beatTimer);
        beatTimer = undefined;
      }
      notify();
    },
    dispose(): void {
      disposed = true;
      playing = false;
      if (beatTimer !== undefined) {
        clearInterval(beatTimer);
        beatTimer = undefined;
      }
      stopDecay();
      listeners.clear();
    },
  };
}

// Onset detection on the low end of the mix (kick, bass, palm-muted chugs).
const ANALYSER_FFT_SIZE = 1024;
const LOW_END_HZ = 180;
const ONSET_RATIO = 1.35; // a beat is this much louder than the running average
const ONSET_FLOOR = 0.2; // ignore onsets in near-silence
const ONSET_GAP_MS = 140; // at most ~7 plucks a second
const AVERAGE_RATE = 0.06; // running-average smoothing per animation frame
const LEVEL_DECAY_PER_SECOND = 2.6; // matches the simulated driver's 0.88 per 50 ms

type AudioContextConstructor = new () => AudioContext;

function audioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as Window & { webkitAudioContext?: AudioContextConstructor };
  return window.AudioContext ?? scope.webkitAudioContext ?? null;
}

/**
 * Plays a real track through an <audio> element and turns its low end into the
 * same decaying envelope the simulated driver produces: `level` jumps to 1 on
 * each detected beat (which plucks a string) and decays in between. The file is
 * only requested when Play is first pressed. Without Web Audio the track still
 * plays and the envelope falls back to a fixed-tempo pulse.
 */
export function createAudioPlayback(opts: { src: string; fallbackBpm?: number }): PlaybackSignal {
  const listeners = new Set<() => void>();
  let status: PlaybackStatus = "paused";
  let wantsPlay = false;
  let level = 0;
  let disposed = false;
  let audio: HTMLAudioElement | null = null;
  let context: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let bins: Uint8Array<ArrayBuffer> | null = null;
  let lowBins = 1;
  let average = 0;
  let lastOnset = 0;
  let lastFrame = 0;
  let frame = 0;
  let pulseTimer: ReturnType<typeof setInterval> | undefined;

  function notify(): void {
    for (const listener of [...listeners]) listener();
  }

  function setStatus(next: PlaybackStatus): void {
    if (status === next) return;
    status = next;
    notify();
  }

  function onset(now: number): void {
    lastOnset = now;
    level = 1;
    notify();
  }

  function tick(now: number): void {
    frame = 0;
    if (disposed || status !== "playing") return;
    const dt = lastFrame === 0 ? 0 : Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    level *= Math.exp(-LEVEL_DECAY_PER_SECOND * dt);
    if (level < 0.001) level = 0;
    if (analyser && bins) {
      analyser.getByteFrequencyData(bins);
      let sum = 0;
      for (let i = 0; i < lowBins; i += 1) sum += bins[i] ?? 0;
      const energy = sum / (lowBins * 255);
      if (
        energy > ONSET_FLOOR &&
        energy > average * ONSET_RATIO &&
        now - lastOnset > ONSET_GAP_MS
      ) {
        onset(now);
      }
      average += (energy - average) * AVERAGE_RATE;
    }
    frame = window.requestAnimationFrame(tick);
  }

  function startAnalysis(): void {
    lastFrame = 0;
    if (frame === 0 && typeof window.requestAnimationFrame === "function") {
      frame = window.requestAnimationFrame(tick);
    }
    if (!analyser && pulseTimer === undefined) {
      const beatMs = 60_000 / (opts.fallbackBpm ?? DEFAULT_BPM);
      pulseTimer = setInterval(() => onset(performance.now()), beatMs);
    }
  }

  function stopAnalysis(): void {
    if (frame !== 0) window.cancelAnimationFrame(frame);
    frame = 0;
    if (pulseTimer !== undefined) clearInterval(pulseTimer);
    pulseTimer = undefined;
    level = 0;
  }

  function connectAnalyser(element: HTMLAudioElement): void {
    const Context = audioContextConstructor();
    if (!Context) return;
    try {
      context = new Context();
      const source = context.createMediaElementSource(element);
      analyser = context.createAnalyser();
      analyser.fftSize = ANALYSER_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyser.connect(context.destination);
      bins = new Uint8Array(analyser.frequencyBinCount);
      const binHz = context.sampleRate / ANALYSER_FFT_SIZE;
      lowBins = Math.max(1, Math.round(LOW_END_HZ / binHz));
    } catch {
      // The element keeps playing on its own; the envelope uses the pulse instead.
      analyser = null;
      bins = null;
    }
  }

  function ensureAudio(): HTMLAudioElement {
    if (audio) return audio;
    const element = new Audio();
    element.preload = "none";
    element.addEventListener("playing", () => {
      if (!wantsPlay) return;
      setStatus("playing");
      startAnalysis();
    });
    // System media controls (keyboard keys, headphones) can start or stop the element directly.
    element.addEventListener("play", () => {
      if (wantsPlay) return;
      wantsPlay = true;
      setStatus("loading");
    });
    element.addEventListener("pause", () => {
      if (!wantsPlay) return;
      wantsPlay = false;
      stopAnalysis();
      setStatus("paused");
    });
    element.addEventListener("waiting", () => {
      if (wantsPlay) setStatus("loading");
    });
    element.addEventListener("ended", () => {
      wantsPlay = false;
      element.currentTime = 0;
      stopAnalysis();
      setStatus("paused");
    });
    element.addEventListener("error", () => {
      wantsPlay = false;
      stopAnalysis();
      setStatus("error");
    });
    element.src = opts.src;
    audio = element;
    // Created inside the click that pressed Play, so browsers allow it to start.
    connectAnalyser(element);
    return element;
  }

  function play(): void {
    const element = ensureAudio();
    // After a failed load, start the request over instead of replaying the error.
    if (status === "error") {
      try {
        element.load();
      } catch {
        // play() below reports the failure.
      }
    }
    wantsPlay = true;
    setStatus("loading");
    void context?.resume().catch(() => undefined);
    let attempt: Promise<void> | undefined;
    try {
      attempt = element.play();
    } catch {
      attempt = Promise.reject(new Error("play() unavailable"));
    }
    attempt?.catch(() => {
      if (!wantsPlay) return;
      wantsPlay = false;
      stopAnalysis();
      setStatus("error");
    });
  }

  function pause(): void {
    wantsPlay = false;
    try {
      audio?.pause();
    } catch {
      // Nothing is playing in environments without media support.
    }
    stopAnalysis();
    setStatus("paused");
  }

  return {
    get playing() {
      return wantsPlay;
    },
    get status() {
      return status;
    },
    get level() {
      return level;
    },
    pluck(stringIndex: number): void {
      if (disposed || !Number.isInteger(stringIndex) || stringIndex < 0) return;
      onset(performance.now());
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    toggle(): void {
      if (disposed) return;
      if (wantsPlay) pause();
      else play();
    },
    dispose(): void {
      disposed = true;
      wantsPlay = false;
      stopAnalysis();
      if (audio) {
        try {
          audio.pause();
          audio.removeAttribute("src");
          audio.load(); // drops the buffered track
        } catch {
          // Environments without media support have nothing to release.
        }
        audio = null;
      }
      void context?.close().catch(() => undefined);
      context = null;
      analyser = null;
      listeners.clear();
    },
  };
}
