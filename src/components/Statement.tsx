/**
 * Statement — the closing line, given a viewport of its own and a slow
 * scrubbed rise so it is still moving when it is read.
 */

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { revealLines } from '../animations/scrollAnimations';
import { TextReveal } from './TextReveal';
import '../styles/statement.css';

export function Statement() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      revealLines('.statement__lines', {
        trigger: ref.current!,
        start: 'top 62%',
        stagger: 0.14,
        duration: 1.8,
        y: 110,
        blur: 12,
      });

      gsap.fromTo(
        '.statement__foot',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.4,
          delay: 0.5,
          scrollTrigger: { trigger: ref.current, start: 'top 55%', once: true },
        }
      );

      // The whole block keeps rising gently while it is on screen.
      gsap.fromTo(
        '.statement__inner',
        { yPercent: 6 },
        {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="close"
      className="section statement on-light"
      data-chapter="close"
      data-bg="#ece7df"
      ref={ref}
    >
      <div className="wrap statement__inner">
        <TextReveal
          as="h2"
          className="display display--lg statement__lines"
          lines={['Nothing added.', 'Nothing left', 'to remove.']}
        />

        <div className="statement__foot">
          <div className="rule" />
          <div className="statement__foot-row">
            <span className="numeral">Collection No. 07</span>
            <span className="numeral">Available by appointment</span>
          </div>
        </div>
      </div>
    </section>
  );
}
