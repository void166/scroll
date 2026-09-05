/**
 * Hero — five viewports of scroll spent on one object.
 *
 * The stage is sticky rather than GSAP-pinned: no pin-spacer, no layout
 * shift on refresh, and ScrollTrigger still scrubs everything inside it.
 */

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { revealLines } from '../animations/scrollAnimations';
import { FrameSequence } from './FrameSequence';
import { TextReveal } from './TextReveal';
import { SEQUENCES } from '../data/scenes';
import '../styles/hero.css';

interface Props {
  ready: boolean;
}

export function Hero({ ready }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ready) return;

    const ctx = gsap.context(() => {
      /* --- opening card ------------------------------------------------- */
      revealLines(stageRef.current, { immediate: true, delay: 0.1, stagger: 0.12 });

      gsap.from('.hero__eyebrow, .hero__cue, .hero__meta', {
        opacity: 0,
        y: 24,
        duration: 1.4,
        stagger: 0.1,
        delay: 0.5,
      });

      gsap.from('.hero__visual', {
        scale: 1.18,
        opacity: 0,
        filter: 'blur(14px)',
        duration: 2.2,
        ease: 'expo.out',
      });

      /* --- scroll choreography ------------------------------------------ */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.9,
        },
      });

      // The camera pushes in, then pulls back out as the section hands over.
      // Scale never drops below the drift: at scale 1 a -2% shift would
      // expose a strip of the section behind the canvas.
      tl.fromTo(
        '.hero__visual',
        { scale: 1.08, yPercent: 0 },
        { scale: 1.02, yPercent: -2, ease: 'none', duration: 0.55 },
        0
      )
        .to(
          '.hero__visual',
          { scale: 1.18, yPercent: -5, filter: 'blur(3px)', opacity: 0, ease: 'power2.in', duration: 0.28 },
          0.72
        )

        // Title leaves early — the object should carry the middle alone.
        .to(
          '.hero__title',
          { yPercent: -70, opacity: 0, filter: 'blur(9px)', ease: 'power2.in', duration: 0.16 },
          0.04
        )
        .to(
          '.hero__eyebrow, .hero__cue',
          { opacity: 0, y: -20, duration: 0.08 },
          0.02
        )

        // A single line surfaces mid-scroll, then clears.
        .fromTo(
          '.hero__aside',
          { opacity: 0, yPercent: 40, filter: 'blur(10px)' },
          { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.14 },
          0.4
        )
        .to(
          '.hero__aside',
          { opacity: 0, yPercent: -34, filter: 'blur(8px)', duration: 0.12 },
          0.62
        )

        .to('.hero__meta', { opacity: 0, duration: 0.1 }, 0.8);
    }, sectionRef);

    return () => ctx.revert();
  }, [ready]);

  return (
    <section
      id="hero"
      className="section hero"
      data-chapter="hero"
      data-bg="#0a0a0b"
      ref={sectionRef}
    >
      <div className="hero__stage" ref={stageRef}>
        <div className="hero__visual">
          <FrameSequence
            spec={SEQUENCES.obsidian}
            trigger={sectionRef}
            start="top top"
            end="bottom bottom"
            scrub={0.8}
            className="hero__canvas"
          />
        </div>

        <div className="hero__overlay wrap">
          <p className="eyebrow hero__eyebrow">
            Vela Armon — Collection No. 07
          </p>

          <TextReveal
            as="h1"
            className="display display--xl hero__title"
            lines={['In silence,', 'form speaks.']}
          />

          <div className="hero__foot">
            <div className="hero__meta numeral">
              <span>Obsidian / Study</span>
              <span>MMXXVI</span>
            </div>
            <div className="hero__cue">
              <span className="numeral">Scroll</span>
              <span className="hero__cue-line" />
            </div>
          </div>
        </div>

        <p className="display display--md hero__aside">
          <span className="italic">Turned</span> against a fixed light
        </p>
      </div>
    </section>
  );
}
