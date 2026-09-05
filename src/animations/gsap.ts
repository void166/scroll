/**
 * Single place where GSAP is configured. Import `gsap` / `ScrollTrigger`
 * from here so plugin registration can never be missed.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Mobile browsers fire a resize every time the address bar collapses.
 * Refreshing ScrollTrigger there causes the pinned scenes to jump.
 */
ScrollTrigger.config({ ignoreMobileResize: true });

gsap.defaults({ ease: 'power3.out', duration: 1 });

export const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (import.meta.env.DEV) {
  // Handy when inspecting trigger geometry from the console.
  (window as unknown as Record<string, unknown>).ScrollTrigger = ScrollTrigger;
  (window as unknown as Record<string, unknown>).gsap = gsap;
}

export { gsap, ScrollTrigger };
