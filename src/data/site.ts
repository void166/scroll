/**
 * site.ts — every asset path and every word on the page.
 *
 * All copy is placeholder: names, prices, dates and contact details are
 * invented. Change them here and nothing else needs touching.
 */

export interface SequenceSpec {
  id: string;
  /** desktop set: every 2nd source frame at 1600×900 */
  path: string;
  count: number;
  /** phone set: every 3rd source frame, cropped to 2:3 */
  mobilePath: string;
  mobileCount: number;
  ext: string;
  /** zero-padding width in the filename */
  pad: number;
  /**
   * Frames loaded before the curtain lifts. The opening run keeps the first
   * chapter smooth; the stride gives the rest of the reel a coarse skeleton
   * so scrubbing ahead always lands on something. Everything else streams in
   * afterwards, nearest-to-playhead first.
   */
  gateHead: number;
  gateStride: number;
}

export const JOURNEY: SequenceSpec = {
  id: 'journey',
  path: '/frames/journey',
  count: 240,
  mobilePath: '/frames/journey-mobile',
  mobileCount: 160,
  ext: 'webp',
  pad: 4,
  gateHead: 24,
  gateStride: 12,
};

export const PLATES = {
  takeoff: '/stills/plate-takeoff.webp',
  coastline: '/stills/plate-coastline.webp',
  lagoon: '/stills/plate-lagoon.webp',
  arrival: '/stills/plate-arrival.webp',
  sunset: '/stills/plate-sunset.webp',
  portrait: '/stills/plate-portrait.webp',
} as const;

export const BRAND = {
  name: 'Vela',
  full: 'Vela Private Travel',
  descriptor: 'Private Travel — Indonesian Archipelago',
  email: 'studio@vela.travel',
  phone: '+62 361 998 214',
  address: ['Jalan Petitenget 18', 'Seminyak, Bali 80361'],
} as const;

/* ------------------------------------------------------------------ *
 * The film — five chapters across one continuous reel cut from 480 source
 * frames. Windows are fractions, so the shipped frame count can change
 * without touching them.
 * `start` / `end` are fractions of the whole journey's scroll.
 * ------------------------------------------------------------------ */

export interface Chapter {
  id: string;
  index: string;
  label: string;
  start: number;
  end: number;
  lines: string[];
  body: string;
  /** where the copy sits over the plate */
  align: 'left' | 'right' | 'centre';
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'takeoff',
    index: '01',
    label: 'Takeoff',
    start: 0,
    end: 0.2,
    lines: ['The journey', 'starts at', 'altitude.'],
    body: 'Six hours of nothing but light on cloud. We time the flight so you land with the sun still climbing, and the first day is not spent recovering from the last one.',
    align: 'left',
  },
  {
    id: 'coastline',
    index: '02',
    label: 'Coastline',
    start: 0.2,
    end: 0.4,
    lines: ['Then the', 'green arrives.'],
    body: 'Volcanic headland, reef breaking white along eleven kilometres of empty sand. No road reaches this stretch. The only way in is the way you just came.',
    align: 'right',
  },
  {
    id: 'lagoon',
    index: '03',
    label: 'The lagoon',
    start: 0.4,
    end: 0.6,
    lines: ['Water that keeps', 'no secrets.'],
    body: 'Four metres down and you can still count the coral. The boat goes out at seven. Most guests use it once and then never again — the swimming is better here.',
    align: 'left',
  },
  {
    id: 'arrival',
    index: '04',
    label: 'Arrival',
    start: 0.6,
    end: 0.8,
    lines: ['A room with', 'nothing between', 'you and the tide.'],
    body: 'Nine villas standing in the water. Teak, linen, a ceiling fan, and a door you will stop bothering to close by the second evening.',
    align: 'right',
  },
  {
    id: 'sunset',
    index: '05',
    label: 'Last light',
    start: 0.8,
    end: 1,
    lines: ['Stay for the', 'last light.'],
    body: 'The pool ends where the ocean starts, which takes a day or two to stop being remarkable. Dinner is served whenever you decide to get out.',
    align: 'left',
  },
];

/* ------------------------------------------------------------------ *
 * Below the film
 * ------------------------------------------------------------------ */

export interface Journey {
  index: string;
  name: string;
  region: string;
  nights: string;
  from: string;
  body: string;
  plate: string;
  shape: 'tall' | 'wide';
}

export const JOURNEYS: Journey[] = [
  {
    index: '01',
    name: 'The long way to Sumba',
    region: 'Sumba & Sumbawa',
    nights: '9 nights',
    from: 'from $9,400',
    body: 'Charter to the south coast, then nothing scheduled for four days. Riding at dawn on the sand, the waterfall at Weekacura in the afternoon, and a village weaver who has been at the same loom for thirty years.',
    plate: PLATES.coastline,
    shape: 'wide',
  },
  {
    index: '02',
    name: 'Reef and ridge',
    region: 'Raja Ampat',
    nights: '7 nights',
    from: 'from $12,200',
    body: 'A liveaboard with six cabins and a dive master who does not oversell it. Mornings underwater, afternoons on the ridge above Piaynemo, and a cook who buys whatever the boats bring in.',
    plate: PLATES.portrait,
    shape: 'tall',
  },
  {
    index: '03',
    name: 'The quiet islands',
    region: 'Flores & Alor',
    nights: '12 nights',
    from: 'from $14,800',
    body: 'The itinerary we send people who have already done the obvious version of Indonesia. Three islands, one boat, and long enough on each to stop counting the days.',
    plate: PLATES.lagoon,
    shape: 'wide',
  },
];

export const APPROACH = [
  {
    index: '01',
    title: 'We go first',
    body: 'Nobody sells you a room we have not slept in. Every property on our list has been visited in the last eighteen months, unannounced and paying full rate.',
  },
  {
    index: '02',
    title: 'One planner, start to finish',
    body: 'The person who writes your itinerary is the person who answers the phone at two in the morning when a flight goes wrong. There is no handover and no call centre.',
  },
  {
    index: '03',
    title: 'Nothing you did not ask for',
    body: 'No padded transfers, no sunset cruise you politely endure. If a day is better left empty, we leave it empty and say so.',
  },
];

/** Sections the navigation indicator steps through. */
export const NAV_SECTIONS = [
  { id: 'film', label: 'The journey' },
  { id: 'journeys', label: 'Journeys' },
  { id: 'approach', label: 'Approach' },
  { id: 'enquire', label: 'Enquire' },
] as const;
