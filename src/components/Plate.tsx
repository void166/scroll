/**
 * Plate — the full-bleed frame. One image, one word, no interface.
 * The word is set in difference blend so it takes its colour from the picture.
 */

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { PLATES } from '../data/scenes';
import '../styles/plate.css';

const WORD = 'Obsidian';

export function Plate() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });

      // A long, even push-in across the whole pass.
      tl.fromTo(
        '.plate__img',
        { scale: 1.28, yPercent: -4 },
        { scale: 1.02, yPercent: 4, ease: 'none', duration: 1 },
        0
      );

      gsap.fromTo(
        '.plate__letter',
        { yPercent: 118, opacity: 0, rotate: 4 },
        {
          yPercent: 0,
          opacity: 1,
          rotate: 0,
          duration: 1.5,
          stagger: 0.045,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 45%', once: true },
        }
      );

      gsap.fromTo(
        '.plate__caption',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          delay: 0.4,
          scrollTrigger: { trigger: ref.current, start: 'top 40%', once: true },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="plate"
      className="section plate"
      data-chapter="plate"
      data-bg="#0a0a0b"
      /* Let the studies finish being read on bone before the ink returns. */
      data-bg-start="top 55%"
      data-bg-end="top 8%"
      ref={ref}
    >
      <div className="plate__stage">
        <div className="plate__media">
          <img className="plate__img" src={PLATES.one} alt="" decoding="async" />
        </div>

        <h2 className="plate__word display" data-cursor="view">
          {WORD.split('').map((letter, i) => (
            <span className="plate__letter-mask" key={i}>
              <span className="plate__letter">{letter}</span>
            </span>
          ))}
        </h2>

        <div className="plate__caption numeral">
          <span>Plate III</span>
          <span>Band and core, 2 400 × 1 350</span>
        </div>
      </div>
    </section>
  );
}
