/**
 * frameLoader.ts — decodes every frame once, up front, into a module-level
 * cache. Components never load images themselves; they ask for a decoded
 * array and start drawing. Nothing here touches React.
 */

import type { SequenceSpec } from '../data/scenes';

/**
 * Decided once, at boot. Swapping sequences mid-session would mean a second
 * download for a viewport that is almost never resized across the breakpoint,
 * so the choice is deliberately sticky.
 */
export const IS_COMPACT =
  typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 860px)').matches ||
    window.matchMedia('(pointer: coarse)').matches);

const cache = new Map<string, HTMLImageElement[]>();

const pad = (n: number) => String(n).padStart(3, '0');

export function framePaths(spec: SequenceSpec): string[] {
  const dir = IS_COMPACT ? spec.mobilePath : spec.path;
  const count = IS_COMPACT ? spec.mobileCount : spec.count;
  return Array.from(
    { length: count },
    (_, i) => `${dir}/frame_${pad(i + 1)}.${spec.ext}`
  );
}

export function frameCount(spec: SequenceSpec): number {
  return IS_COMPACT ? spec.mobileCount : spec.count;
}

export function getSequence(id: string): HTMLImageElement[] {
  return cache.get(id) ?? [];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      // decode() keeps the first paint of each frame off the scroll thread
      const done = () => resolve(img);
      if (typeof img.decode === 'function') img.decode().then(done, done);
      else done();
    };
    // A missing frame must not deadlock the loader — resolve with a blank
    // image and let the canvas skip it.
    img.onerror = () => resolve(img);
    img.src = src;
  });
}

/** Runs `task` over `items` with a fixed number of workers in flight. */
async function pool<T>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<void>
) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      for (;;) {
        const i = cursor++;
        if (i >= items.length) return;
        await task(items[i], i);
      }
    })()
  );
  await Promise.all(workers);
}

export interface PreloadJob {
  sequences: SequenceSpec[];
  stills: string[];
}

/**
 * Loads everything the opening needs and reports 0 → 1 progress.
 * Fonts are folded into the total so the hero never swaps typefaces on screen.
 */
export async function preload(
  job: PreloadJob,
  onProgress: (value: number) => void
): Promise<void> {
  const groups = job.sequences.map((spec) => ({
    spec,
    paths: framePaths(spec),
  }));

  const total =
    groups.reduce((sum, g) => sum + g.paths.length, 0) + job.stills.length + 4;

  let done = 0;
  const tick = () => onProgress(Math.min(1, ++done / total));

  const fonts =
    typeof document !== 'undefined' && 'fonts' in document
      ? document.fonts.ready.then(() => {
          done += 4;
          onProgress(Math.min(1, done / total));
        })
      : Promise.resolve();

  // Frames first, in order, so the hero is drawable as early as possible.
  for (const group of groups) {
    const images: HTMLImageElement[] = new Array(group.paths.length);
    cache.set(group.spec.id, images);
    await pool(group.paths, 10, async (src, i) => {
      images[i] = await loadImage(src);
      tick();
    });
  }

  await pool(job.stills, 6, async (src) => {
    await loadImage(src);
    tick();
  });

  await fonts;
  onProgress(1);
}
