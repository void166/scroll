/**
 * Studies — text and visual in the same field. The heading holds still on the
 * left while the right column moves past it; the plates drift at their own
 * rate so the column never reads as a list of cards.
 */

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { revealLines, revealWords, parallax, plateReveal } from '../animations/scrollAnimations';
import { TextReveal } from './TextReveal';
import { STUDIES, PLATES } from '../data/scenes';
import '../styles/studies.css';

export function Studies() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      revealLines('.studies__title', { trigger: ref.current!, start: 'top 70%' });

      document.querySelectorAll('.studies__entry').forEach((entry) => {
        revealLines(entry, { trigger: entry, start: 'top 80%', y: 105, stagger: 0.05 });
        revealWords(entry, { trigger: entry, start: 'top 78%' });
        gsap.fromTo(
          entry.querySelector('.studies__entry-rule'),
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.5,
            ease: 'expo.out',
            scrollTrigger: { trigger: entry, start: 'top 85%', once: true },
          }
        );
      });

      document.querySelectorAll<HTMLElement>('.studies__plate').forEach((plate, i) => {
        plateReveal(plate.querySelector('img'), plate);
        parallax(plate.querySelector('img'), i === 0 ? 80 : -60);
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="studies"
      className="section studies on-light"
      data-chapter="studies"
      data-bg="#ece7df"
      ref={ref}
    >
      <div className="wrap studies__inner">
        <div className="studies__head">
          <span className="numeral">02 — Studies</span>
          <TextReveal
            as="h2"
            className="display display--md studies__title"
            lines={['Three', 'measurements', 'of the same', 'object.']}
          />
        </div>

        <div className="studies__column">
          {STUDIES.map((study, i) => (
            <div key={study.index}>
              <article className="studies__entry">
                <div className="studies__entry-rule rule" />
                <div className="studies__entry-head">
                  <span className="numeral">{study.index}</span>
                  <TextReveal
                    as="h3"
                    className="display display--md studies__entry-title"
                    lines={[study.title]}
                  />
                </div>
                <TextReveal
                  as="p"
                  className="body-text studies__entry-body"
                  text={study.body}
                />
              </article>

              {i < 2 && (
                <figure
                  className={`studies__plate studies__plate--${
                    i === 0 ? 'tall' : 'wide'
                  }`}
                >
                  <img
                    src={i === 0 ? PLATES.four : PLATES.two}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
