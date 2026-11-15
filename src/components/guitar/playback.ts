export type PlaybackSignal = {
  readonly playing: boolean;
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
