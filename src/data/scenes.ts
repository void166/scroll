/**
 * scenes.ts — every asset path and every word on the page.
 * Keeping the copy here means the components stay purely structural.
 */

export interface SequenceSpec {
  /** cache key */
  id: string;
  /** desktop frames */
  path: string;
  count: number;
  /** lighter set served to narrow / coarse-pointer devices */
  mobilePath: string;
  mobileCount: number;
  ext: string;
}

export const SEQUENCES: Record<'obsidian' | 'drape', SequenceSpec> = {
  obsidian: {
    id: 'obsidian',
    path: '/frames/obsidian',
    count: 60,
    mobilePath: '/frames/obsidian-mobile',
    mobileCount: 30,
    ext: 'webp',
  },
  drape: {
    id: 'drape',
    path: '/frames/drape',
    count: 48,
    mobilePath: '/frames/drape-mobile',
    mobileCount: 24,
    ext: 'webp',
  },
};

export const PLATES = {
  one: '/stills/plate-01.webp',
  two: '/stills/plate-02.webp',
  three: '/stills/plate-03.webp',
  four: '/stills/plate-04.webp',
} as const;

/** Sections the navigation indicator steps through. */
export const CHAPTERS = [
  { id: 'hero', label: 'Opening' },
  { id: 'intro', label: 'Statement' },
  { id: 'story', label: 'The Turning' },
  { id: 'sequence', label: 'Drape' },
  { id: 'studies', label: 'Studies' },
  { id: 'plate', label: 'Obsidian' },
  { id: 'close', label: 'Colophon' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

/** The three beats of the pinned cinematic story section. */
export const STORY_BEATS = [
  {
    index: '01',
    kicker: 'Origin',
    line: ['Light is the', 'first material.'],
    body:
      'Before the metal, before the stone. We begin by deciding where the light will fall, and everything after that is consequence.',
  },
  {
    index: '02',
    kicker: 'Method',
    line: ['A single form,', 'turned ten', 'thousand times.'],
    body:
      'One volume, rotated against a fixed lamp until the silhouette stops arguing with itself. Most of the work is subtraction.',
  },
  {
    index: '03',
    kicker: 'Result',
    line: ['Everything else', 'is patience.'],
    body:
      'Nine months from the first turn to the last polish. The object does not announce this. It is simply present, and quiet.',
  },
] as const;

export const STUDIES = [
  {
    index: '01',
    title: 'Weight',
    body:
      'Held in the hand, the piece resolves at four hundred grams — heavy enough to be believed, light enough to be worn without ceremony.',
  },
  {
    index: '02',
    title: 'Surface',
    body:
      'Eleven passes of hand polishing. The final two are done dry, by feel, in a room with a single north window.',
  },
  {
    index: '03',
    title: 'Silence',
    body:
      'No logo, no serial, no seam. Identity is carried by the curve where the band folds through itself, which cannot be copied without being understood.',
  },
] as const;
