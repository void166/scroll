/**
 * frameLoader.ts — decoded-frame cache with progressive delivery.
 *
 * 480 frames is 29 MB. Waiting for all of it behind a loading screen is not
 * an option, so loading happens in two stages:
 *
 *   1. GATE — a run of opening frames (so the first chapter is smooth) plus
 *      every Nth frame across the rest (so scrubbing ahead always lands on
 *      something). This is what the loading screen actually waits for.
 *   2. STREAM — everything else, in the background, always fetching the
 *      pending frame closest to where the viewer currently is. Scroll forward
 *      and the reel fills in ahead of you; jump to the end and the scheduler
 *      follows.
 *
 * Until a frame arrives the canvas draws the nearest one that has, so the
 * film is watchable from the first second and simply sharpens in resolution
 * of movement as it fills.
 *
 * Nothing here touches React.
 */

import type { SequenceSpec } from '../data/site';

/**
 * Decided once, at boot. Swapping sets mid-session would mean re-downloading
 * a reel for a viewport that is almost never resized across the breakpoint.
 */
export const IS_COMPACT =
  typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 860px)').matches ||
    window.matchMedia('(pointer: coarse)').matches);

export interface SequenceState {
  count: number;
  images: (HTMLImageElement | undefined)[];
  ready: Uint8Array;
  pending: Uint8Array;
  readyCount: number;
  /** frame the viewer is currently on; steers the stream scheduler */
  playhead: number;
  streaming: boolean;
}

const cache = new Map<string, SequenceState>();

export function frameCount(spec: SequenceSpec): number {
  return IS_COMPACT ? spec.mobileCount : spec.count;
}

export function framePath(spec: SequenceSpec, index: number): string {
  const dir = IS_COMPACT ? spec.mobilePath : spec.path;
  const n = String(index + 1).padStart(spec.pad, '0');
  return `${dir}/frame_${n}.${spec.ext}`;
}

export function getSequence(id: string): SequenceState | undefined {
  return cache.get(id);
}

function ensure(spec: SequenceSpec): SequenceState {
  let state = cache.get(spec.id);
  if (!state) {
    const count = frameCount(spec);
    state = {
      count,
      images: new Array(count),
      ready: new Uint8Array(count),
      pending: new Uint8Array(count),
      readyCount: 0,
      playhead: 0,
      streaming: false,
    };
    cache.set(spec.id, state);
  }
  return state;
}

/** Nearest frame at or around `index` that is decoded, or -1 if none is. */
export function nearestReady(state: SequenceState, index: number): number {
  if (state.ready[index]) return index;
  for (let r = 1; r < state.count; r++) {
    const lo = index - r;
    const hi = index + r;
    if (lo >= 0 && state.ready[lo]) return lo;
    if (hi < state.count && state.ready[hi]) return hi;
    if (lo < 0 && hi >= state.count) break;
  }
  return -1;
}

export function setPlayhead(id: string, index: number) {
  const state = cache.get(id);
  if (state) state.playhead = index;
}

/**
 * In-flight loads, keyed sequence:index. Without this, two callers wanting
 * the same frame — the gate pass and the streamer, or a StrictMode double
 * mount — each start a request and each count the result, inflating
 * readyCount past the size of the reel.
 */
const inflight = new Map<string, Promise<void>>();

function loadFrame(state: SequenceState, spec: SequenceSpec, i: number) {
  if (state.ready[i]) return Promise.resolve();

  const key = `${spec.id}:${i}`;
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = new Promise<void>((resolve) => {
    state.pending[i] = 1;

    const img = new Image();
    img.decoding = 'async';

    const settle = (ok: boolean) => {
      state.pending[i] = 0;
      inflight.delete(key);
      if (ok && !state.ready[i]) {
        state.images[i] = img;
        state.ready[i] = 1;
        state.readyCount++;
      }
      resolve();
    };

    img.onload = () => {
      // decode() keeps the first paint of each frame off the scroll thread
      if (typeof img.decode === 'function') {
        img.decode().then(
          () => settle(true),
          () => settle(true)
        );
      } else settle(true);
    };
    // A missing frame must not stall the reel — the canvas will draw its
    // nearest neighbour instead.
    img.onerror = () => settle(false);
    img.src = framePath(spec, i);
  });

  inflight.set(key, promise);
  return promise;
}

/** Indices loaded before the curtain lifts. */
function gateIndices(spec: SequenceSpec, count: number): number[] {
  const head = Math.min(
    count,
    IS_COMPACT ? Math.ceil(spec.gateHead / 2) : spec.gateHead
  );
  const stride = IS_COMPACT
    ? Math.max(2, Math.round(spec.gateStride / 2))
    : spec.gateStride;

  const set = new Set<number>();
  for (let i = 0; i < head; i++) set.add(i);
  for (let i = head; i < count; i += stride) set.add(i);
  set.add(count - 1);
  return [...set];
}

async function pool<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>
) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () =>
      (async () => {
        for (;;) {
          const i = cursor++;
          if (i >= items.length) return;
          await task(items[i]);
        }
      })()
    )
  );
}

export interface PreloadJob {
  sequence: SequenceSpec;
  stills: string[];
}

/**
 * Loads the gate set and the stills, reporting 0 → 1. Fonts are folded in so
 * the opening titles never swap typeface on screen.
 */
export async function preloadGate(
  job: PreloadJob,
  onProgress: (value: number) => void
): Promise<void> {
  const spec = job.sequence;
  const state = ensure(spec);
  const gate = gateIndices(spec, state.count);

  const total = gate.length + job.stills.length + 4;
  let done = 0;
  const tick = () => onProgress(Math.min(1, ++done / total));

  const fonts =
    typeof document !== 'undefined' && 'fonts' in document
      ? document.fonts.ready.then(() => {
          done += 4;
          onProgress(Math.min(1, done / total));
        })
      : Promise.resolve();

  await pool(gate, 8, async (i) => {
    await loadFrame(state, spec, i);
    tick();
  });

  await pool(job.stills, 4, async (src) => {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    });
    tick();
  });

  await fonts;
  onProgress(1);
}

/**
 * Fills in every remaining frame, always choosing the pending frame nearest
 * the playhead so the reel sharpens where the viewer actually is.
 */
export function startStreaming(spec: SequenceSpec) {
  const state = ensure(spec);
  if (state.streaming) return;
  state.streaming = true;

  const pickNext = () => {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < state.count; i++) {
      if (state.ready[i] || state.pending[i]) continue;
      const d = Math.abs(i - state.playhead);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  };

  const lanes = IS_COMPACT ? 3 : 6;
  let running = lanes;
  for (let lane = 0; lane < lanes; lane++) {
    (async () => {
      for (;;) {
        const next = pickNext();
        if (next < 0) break;
        await loadFrame(state, spec, next);
      }
      // Only the last lane out turns the light off.
      if (--running === 0) state.streaming = false;
    })();
  }
}

export function streamProgress(id: string): number {
  const state = cache.get(id);
  return state ? state.readyCount / state.count : 0;
}

if (import.meta.env.DEV) {
  // Handy when checking how far the reel has streamed from the console.
  (window as unknown as Record<string, unknown>).frameStats = () =>
    [...cache.entries()].map(([id, s]) => ({
      id,
      ready: s.readyCount,
      count: s.count,
      playhead: s.playhead,
      streaming: s.streaming,
    }));
}
