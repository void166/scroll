/**
 * Intro — the first breath of light after the hero. Bone ground, one column
 * of type, a great deal of nothing around it.
 */

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { revealLines, revealWords } from '../animations/scrollAnimations';
import { TextReveal } from './TextReveal';
import '../styles/intro.css';

export function Intro() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      revealLines('.intro__lead', { trigger: ref.current!, start: 'top 68%' });
      revealWords('.intro__para', { start: 'top 80%' });

      gsap.fromTo(
        '.intro__rule',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.intro__rule', start: 'top 88%', once: true },
        }
      );

      // The index column drifts against the reading column.
      gsap.fromTo(
        '.intro__aside',
        { y: 40 },
        {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="intro"
      className="section intro on-light"
      data-chapter="intro"
      data-bg="#ece7df"
      ref={ref}
    >
      <div className="wrap intro__inner">
        <aside className="intro__aside">
          <span className="numeral">01 — Statement</span>
        </aside>

        <div className="intro__body">
          <TextReveal
            as="h2"
            className="display display--lg intro__lead"
            lines={[
              'We make one object',
              'at a time, and we',
              'make it slowly.']}
          />

          <div className="intro__rule rule" />

          <TextReveal
            as="p"
            className="body-text intro__para"
            text="Vela Armon works in the narrow country between architecture and adornment. Each collection begins with a single volume and a single lamp, and ends when there is nothing left that can be removed without the piece losing its argument. Collection No. 07 is a study in turning — one band, folded through itself, photographed sixty times as it rotates against a fixed light."
          />
        </div>
      </div>
    </section>
  );
}
