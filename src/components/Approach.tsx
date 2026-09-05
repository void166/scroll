/**
 * Approach — three plain statements on ink, with a full-bleed plate that
 * pushes in behind the closing line.
 */

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { revealLines, revealWords, fadeUp } from '../animations/scrollAnimations';
import { TextReveal } from './TextReveal';
import { APPROACH, PLATES } from '../data/site';
import '../styles/approach.css';

export function Approach() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      revealLines('.approach__title', { trigger: ref.current!, start: 'top 72%' });

      ref.current?.querySelectorAll('.approach__item').forEach((item) => {
        revealLines(item, { trigger: item, start: 'top 84%', y: 105 });
        revealWords(item, { trigger: item, start: 'top 82%' });
      });

      fadeUp('.approach__item .numeral', {
        trigger: '.approach__grid',
        start: 'top 82%',
      });

      gsap.fromTo(
        '.approach__plate picture',
        { scale: 1.25, yPercent: -4 },
        {
          scale: 1.02,
          yPercent: 4,
          ease: 'none',
          scrollTrigger: {
            trigger: '.approach__plate',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );

      revealLines('.approach__pull', {
        trigger: '.approach__plate',
        start: 'top 55%',
        stagger: 0.12,
        duration: 1.6,
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="approach"
      className="section approach"
      data-chapter="approach"
      data-bg="#0b0f12"
      ref={ref}
    >
      <div className="wrap">
        <header className="approach__head">
          <span className="numeral">Approach</span>
          <TextReveal
            as="h2"
            className="display display--md approach__title"
            lines={['A small office', 'that answers', 'the phone.']}
          />
        </header>

        <div className="approach__grid">
          {APPROACH.map((item) => (
            <article className="approach__item" key={item.index}>
              <span className="numeral">{item.index}</span>
              <TextReveal
                as="h3"
                className="display approach__item-title"
                lines={[item.title]}
              />
              <TextReveal as="p" className="body-text" text={item.body} />
            </article>
          ))}
        </div>
      </div>

      <figure className="approach__plate">
        {/* The landscape plate loses its composition in a tall narrow crop,
            so phones get the portrait cut instead. */}
        <picture>
          <source media="(max-width: 860px)" srcSet={PLATES.portrait} />
          <img src={PLATES.sunset} alt="" loading="lazy" decoding="async" />
        </picture>
        <figcaption className="wrap">
          <TextReveal
            as="p"
            className="display display--md approach__pull"
            lines={['We have been', 'wrong about a', 'lot of places.']}
          />
          <span className="numeral">
            Which is why we keep going back to check.
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
