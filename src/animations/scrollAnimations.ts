/**
 * scrollAnimations.ts — the vocabulary of the site.
 *
 * Every function here is a factory: it takes elements, builds GSAP work and
 * returns it. None of them touch React. Components call them inside a
 * `gsap.context()` so teardown reverts every tween and ScrollTrigger at once.
 */

import { gsap, ScrollTrigger, REDUCED } from './gsap';

/** Anything a factory will accept as a target: a node or a CSS selector. */
type El = Element | string | null | undefined;

function resolve(el: El): Element | null {
  if (!el) return null;
  return typeof el === 'string' ? document.querySelector(el) : el;
}

/* -------------------------------------------------------------------------
   Text
   ------------------------------------------------------------------------- */

export interface RevealOptions {
  /** element or selector; ScrollTrigger accepts either */
  trigger?: Element | string;
  start?: string;
  delay?: number;
  stagger?: number;
  y?: number;
  blur?: number;
  duration?: number;
  /** play immediately instead of waiting for a scroll trigger */
  immediate?: boolean;
}

/**
 * The house reveal: masked lines rise, un-blur and settle.
 * Applied to `.reveal-line > span` inside `scope`.
 */
export function revealLines(target: El, options: RevealOptions = {}) {
  const scope = resolve(target);
  if (!scope) return;
  const targets = scope.querySelectorAll<HTMLElement>('.reveal-line > span');
  if (!targets.length) return;

  const {
    trigger = scope,
    start = 'top 82%',
    delay = 0,
    stagger = 0.09,
    y = 100,
    blur = 8,
    duration = 1.4,
    immediate = false,
  } = options;

  if (REDUCED) {
    gsap.set(targets, { opacity: 1, y: 0, filter: 'none' });
    return;
  }

  return gsap.fromTo(
    targets,
    {
      yPercent: y,
      opacity: 0,
      filter: `blur(${blur}px)`,
    },
    {
      yPercent: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration,
      delay,
      stagger,
      ease: 'expo.out',
      scrollTrigger: immediate
        ? undefined
        : { trigger, start, once: true },
    }
  );
}

/** Softer variant for body copy: word-level drift, no mask. */
export function revealWords(target: El, options: RevealOptions = {}) {
  const scope = resolve(target);
  if (!scope) return;
  const targets = scope.querySelectorAll<HTMLElement>('.word > span');
  if (!targets.length) return;

  const {
    trigger = scope,
    start = 'top 78%',
    delay = 0,
    stagger = 0.018,
    duration = 1.1,
  } = options;

  if (REDUCED) {
    gsap.set(targets, { opacity: 1, y: 0, filter: 'none' });
    return;
  }

  return gsap.fromTo(
    targets,
    { yPercent: 105, opacity: 0, filter: 'blur(5px)' },
    {
      yPercent: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration,
      delay,
      stagger,
      ease: 'expo.out',
      scrollTrigger: { trigger, start, once: true },
    }
  );
}

/** Generic soft entrance for anything that is not type. */
export function fadeUp(targets: gsap.TweenTarget, options: RevealOptions = {}) {
  const {
    trigger,
    start = 'top 85%',
    delay = 0,
    stagger = 0.08,
    y = 40,
    duration = 1.2,
  } = options;

  if (REDUCED) {
    gsap.set(targets, { opacity: 1, y: 0 });
    return;
  }

  return gsap.fromTo(
    targets,
    { y, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration,
      delay,
      stagger,
      scrollTrigger: trigger ? { trigger, start, once: true } : undefined,
    }
  );
}

/* -------------------------------------------------------------------------
   Image
   ------------------------------------------------------------------------- */

/** Clip-path curtain plus a slow push-in, scrubbed against the viewport. */
export function plateReveal(target: El, triggerTarget: El) {
  const el = resolve(target);
  const trigger = resolve(triggerTarget);
  if (!el || !trigger) return;

  gsap.fromTo(
    el,
    { clipPath: 'inset(18% 12% 18% 12%)', scale: 1.24, filter: 'blur(6px)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      scale: 1.06,
      filter: 'blur(0px)',
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'top 90%',
        end: 'top 10%',
        scrub: 1,
      },
    }
  );
}

/** Vertical drift for stacked editorial imagery. */
export function parallax(target: El, distance = 90) {
  const el = resolve(target);
  if (!el || REDUCED) return;
  gsap.fromTo(
    el,
    { yPercent: -distance / 10 },
    {
      yPercent: distance / 10,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement ?? el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.1,
      },
    }
  );
}

/* -------------------------------------------------------------------------
   Page background
   ------------------------------------------------------------------------- */

/**
 * Interpolates the fixed backdrop between the tones declared by
 * `[data-bg]` sections. The handover happens while the incoming section is
 * still mostly below the fold, so type is never dark-on-dark mid-transition.
 */
export function initBackgroundScheduler(target: El) {
  const backdrop = resolve(target);
  if (!backdrop) return;

  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('[data-bg]')
  );
  if (!sections.length) return;

  gsap.set(backdrop, { backgroundColor: sections[0].dataset.bg });

  sections.forEach((section, i) => {
    const to = section.dataset.bg;
    const from = i === 0 ? to : sections[i - 1].dataset.bg;
    if (!to || from === to) return;

    /*
     * The window has to close well before the section's own content is
     * centred, and it has to open after the previous section's window has
     * closed — otherwise a section shorter than the viewport never gets to
     * hold its own tone. Sections can widen or delay their window when the
     * default reads badly, as the footer does.
     */
    gsap.fromTo(
      backdrop,
      { backgroundColor: from },
      {
        backgroundColor: to,
        ease: 'none',
        immediateRender: false,
        scrollTrigger: {
          trigger: section,
          start: section.dataset.bgStart ?? 'top 75%',
          end: section.dataset.bgEnd ?? 'top 25%',
          scrub: 0.6,
        },
      }
    );
  });
}

/* -------------------------------------------------------------------------
   Chapter tracking for the navigation indicator
   ------------------------------------------------------------------------- */

export function trackChapters(onChange: (id: string) => void) {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('[data-chapter]')
  );

  return sections.map((section) =>
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (self.isActive) onChange(section.dataset.chapter as string);
      },
    })
  );
}
