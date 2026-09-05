# Vela — Private Travel

A scroll-driven travel site. One continuous aerial reel runs from takeoff to
last light while five chapters of copy fade through on top of it; the
itineraries, the approach and the enquiry sit underneath.

React 19 · TypeScript · Vite · GSAP + ScrollTrigger · Canvas 2D · Lucide.
No UI framework, no scroll-hijacking library.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run frames     # re-encode the reel from the source plates (~30s)
```

## The film

`src/components/Film.tsx` pins a canvas for about nine screens of scroll and
scrubs the whole reel across it. The five chapters are fractions of that
scroll, declared in `src/data/site.ts`:

| # | Chapter    | Scroll     |
| - | ---------- | ---------- |
| 1 | Takeoff    | 0 – 20 %   |
| 2 | Coastline  | 20 – 40 %  |
| 3 | The lagoon | 40 – 60 %  |
| 4 | Arrival    | 60 – 80 %  |
| 5 | Last light | 80 – 100 % |

Because the windows are fractions, the shipped frame count can change without
touching them — re-cut the reel and the chapters still land in the same place.

```
scroll  →  ScrollTrigger (scrub)  →  GSAP timeline  →  canvas blit
```

React renders once and gets out of the way. Nothing in a scroll path calls
`setState`: the frame index, the counter, the progress bar and the page
background are written straight to the DOM or the canvas from GSAP callbacks.

## Frames: the tradeoff that matters

The source is 480 plates at 1920×1080, 84 MB. That cannot go on a website as
it is, and the interesting question is *where* to spend the budget.

**Resolution beats frame count.** The canvas cross-dissolves neighbouring
frames, so halving the number of frames is invisible in motion — while halving
the resolution is obvious the moment anything holds still. The first cut of
this site shipped 480 frames at 1280×720 and looked soft; the same byte budget
spent the other way is sharp:

| | Frames | Size | Total |
| --- | --- | --- | --- |
| First attempt | 480 | 1280×720 | 40 MB, visibly soft |
| **Shipped (desktop)** | **240** | **1600×900** | **21 MB** |
| **Shipped (phones)** | **160** | **960×1440** | **9.8 MB** |

The phone set is cropped to 2:3 rather than letterboxed, which is close enough
to a phone's own aspect that the canvas barely has to upscale — upscaling is
what actually makes a frame look soft, more than the encoder does.

To change any of this, edit the two loops in `tools/frames.mjs` and update
`count` / `mobileCount` in `src/data/site.ts` to match, then `npm run frames`.

### Progressive loading

21 MB behind a loading screen is not an option, so `src/lib/frameLoader.ts`
loads in two stages:

1. **Gate** — an opening run of frames plus every Nth frame across the rest,
   so the first chapter is smooth and scrubbing ahead always lands on
   something. This is all the loading screen waits for.
2. **Stream** — everything else in the background, always fetching the pending
   frame *nearest the viewer's current position*. Scroll forward and the reel
   fills in ahead of you.

Until a frame arrives the canvas draws the nearest one that has, so the film
is watchable from the first second and sharpens in resolution of movement as
it fills. `window.frameStats()` reports progress in dev.

## Deploying to Vercel

Vercel detects Vite, runs `npm run build`, serves `dist`. Push to a git host
and import, or:

```bash
npx vercel --prod
```

Set `VITE_SITE_URL` to the final domain (no trailing slash) so social cards get
absolute URLs; `vite.config.ts` rewrites the `__SITE_URL__` tokens in
`index.html` at build time, falling back to Vercel's own domain.

`/frames/*` and `/stills/*` are served `immutable` for a year. Filenames are
stable, so if you re-cut the reel, rename the directory rather than relying on
returning visitors to re-fetch.

## Layout

```
src/
├── animations/     gsap.ts, scrollAnimations.ts (reveal/parallax/background
│                   vocabulary — none of it touches React)
├── components/     Film + the sections below it, plus FrameSequence,
│                   Loader, Navigation, Cursor, TextReveal
├── data/site.ts    every asset path and every word on the page
├── hooks/          useFrameSequence — canvas engine, zero React state
├── lib/            frameLoader — gate, stream, nearest-ready fallback
└── styles/         global.css (design system) + one sheet per component
```

`global.css` must be imported before `App` in `main.tsx`; component sheets load
through `App`, and the later sheet wins ties such as `.display { margin: 0 }`.

## Notes

- **All copy is placeholder** — brand name, itineraries, prices, address and
  contact details are invented. They live in `src/data/site.ts`.
- The enquiry is a `mailto:` rather than a form, because there is no backend
  and a form that silently does nothing is worse than no form.
- Stages pin with CSS `position: sticky`, not `ScrollTrigger.pin`. This is why
  the root uses `overflow-x: clip` and never `hidden` — `hidden` makes the root
  a scroll container and every sticky stage silently stops sticking.
- `<body>` deliberately has no background: one there would paint above the
  negative-z-index `.backdrop` and freeze the page tone.
- `prefers-reduced-motion` skips the reveals and the grain; the custom cursor
  never mounts on coarse pointers.
