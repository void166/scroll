# Vela Armon — Collection No. 07

A scroll-driven editorial site. Scroll position is the only input: it drives
two canvas frame sequences, every pinned scene, and the page's background tone.

React 19 · TypeScript · Vite · GSAP + ScrollTrigger · Canvas 2D · Lucide.
No UI framework, no scroll-hijacking library.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run frames     # re-render every frame and still (~2 min on 16 cores)
```

## Deploying to Vercel

Zero configuration beyond what is committed. Vercel detects Vite, runs
`npm run build`, and serves `dist`.

**From the dashboard:** push this repo to GitHub/GitLab, then *Add New →
Project* and import it. Leave every build setting on its default —
[`vercel.json`](./vercel.json) already pins the framework, build command and
output directory.

**From the CLI:**

```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production
```

### One thing to set

Add an environment variable so social cards get absolute URLs:

| Variable | Value |
| --- | --- |
| `VITE_SITE_URL` | `https://your-domain.com` (no trailing slash) |

Without it the build falls back to Vercel's own production domain, and failing
that to root-relative `og:image` URLs — which work in some scrapers and not
others. `vite.config.ts` resolves this at build time and rewrites the
`__SITE_URL__` tokens in `index.html`.

### Notes

- **Frame caching.** `/frames/*` and `/stills/*` are served
  `max-age=31536000, immutable`. Filenames are stable, so if you re-run
  `npm run frames` and redeploy, returning visitors keep the old frames until
  the cache expires. Rename the directory (`obsidian-v2/`) when you re-cut a
  sequence.
- **`sharp` is a devDependency** and Vercel will install it, though nothing in
  the build imports it — it is only used by `npm run frames`. The lockfile
  carries the Linux binaries, so `npm ci` resolves on their build image. Drop
  it from `package.json` if you would rather not pay the install time and only
  re-render frames locally.
- **No router**, so no SPA rewrite is configured. If you add one, add a
  `rewrites` entry sending everything to `/index.html`.
- The frames are committed to `public/` — they are the site, not build output.
  Don't gitignore them.

## How the scroll pipeline works

```
scroll  →  ScrollTrigger (scrub)  →  GSAP timeline  →  canvas blit / transform
```

React renders the page once and then gets out of the way. Nothing in a scroll
path calls `setState`: the frame index, the sequence counter, the story
progress read-out and the background colour are all written straight to the
DOM or the canvas from GSAP callbacks. The only per-scroll React state on the
whole page is the navigation's chapter label, which changes seven times.

### `FrameSequence`

A reusable canvas bound to a scroll window.

```tsx
<FrameSequence
  spec={SEQUENCES.obsidian}
  trigger={sectionRef}
  start="top top"
  end="bottom bottom"
  scrub={0.8}
  onProgress={(p, frame, total) => { /* write to the DOM, never to state */ }}
/>
```

It owns exactly one ScrollTrigger, created inside a `gsap.context()` that is
reverted on unmount. `useFrameSequence` handles the rest: DPR-aware sizing via
`ResizeObserver`, cover-fit drawing, and a cross-dissolve between adjacent
frames so 60 stills read as continuous motion rather than a flipbook.

Note that the setup runs in `useEffect`, not `useLayoutEffect`. The trigger is
an **ancestor** element, and React attaches a parent's ref only after its
children's layout effects have run — reading it there hands you `null` and the
ScrollTrigger is silently never created.

### Pinning

Scenes pin with CSS `position: sticky`, not `ScrollTrigger.pin`. No pin-spacer,
no reflow on refresh, and scrubbing is unaffected.

This is why `html` uses `overflow-x: clip` rather than `overflow-x: hidden`:
`hidden` makes the root a scroll container, and every sticky stage on the page
then sticks to *that* instead of the viewport — which looks exactly like
sticky being ignored.

### Background

One fixed `.backdrop` element behind everything, tweened between the tones
declared by `[data-bg]` on each section. A section can widen or delay its own
handover with `data-bg-start` / `data-bg-end` when the default reads badly.

`<body>` deliberately has no background: a background there paints in the root
stacking context *above* negative-z-index children, which would hide the
backdrop permanently.

## Frames

The sequences are rendered, not filmed. `tools/engine.mjs` is a small CPU
raymarcher — signed distance fields, soft shadows, ACES tone mapping — and
`tools/render.mjs` runs it across worker threads and encodes WebP.

| Sequence   | Desktop        | Compact       |
| ---------- | -------------- | ------------- |
| `obsidian` | 60 × 1440×810  | 30 × 828×1104 |
| `drape`    | 48 × 1440×810  | 24 × 828×1104 |

Everything the loader waits on totals **under 2 MB**. Compact devices get half
the frames at a portrait crop; the choice is made once at boot in
`lib/frameLoader.ts` and is deliberately sticky for the session.

To art-direct: edit the SDFs or the `paramsA` / `paramsB` camera
choreography in `tools/engine.mjs`, then `npm run frames`.

## Layout

```
src/
├── animations/     gsap.ts (plugin registration), scrollAnimations.ts (the
│                   reveal/parallax/background vocabulary — no React)
├── components/     one file per section, plus FrameSequence, Loader,
│                   Navigation, Cursor, TextReveal
├── data/scenes.ts  asset paths, chapters, and every word on the page
├── hooks/          useFrameSequence — canvas engine, zero React state
├── lib/            frameLoader — decode-once cache + progress
└── styles/         global.css (design system) + one sheet per component
```

`global.css` must be imported before `App` in `main.tsx`; component sheets load
through `App`, and the later sheet wins ties such as `.display { margin: 0 }`
against a component's own margin.

## Accessibility and fallbacks

- `prefers-reduced-motion` skips the reveal animations and the grain.
- The custom cursor is never mounted on coarse pointers.
- Text masks clip on the block axis only (`clip-path`, not `overflow: hidden`),
  so italics and large serifs keep their side bearings.
