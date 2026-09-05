/**
 * Journeys — three itineraries, set as editorial spreads rather than cards.
 * The plate and the copy alternate sides and drift at different rates.
 */

import { useLayoutEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap } from '../animations/gsap';
import {
  revealLines,
  revealWords,
  parallax,
  plateReveal,
} from '../animations/scrollAnimations';
import { TextReveal } from './TextReveal';
import { JOURNEYS } from '../data/site';
import '../styles/journeys.css';

export function Journeys() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      revealLines('.journeys__title', { trigger: ref.current!, start: 'top 74%' });
      revealWords('.journeys__lede', { start: 'top 80%' });

      ref.current?.querySelectorAll('.journey').forEach((entry) => {
        revealLines(entry, { trigger: entry, start: 'top 76%', y: 105, stagger: 0.06 });
        revealWords(entry, { trigger: entry, start: 'top 74%' });

        gsap.fromTo(
          entry.querySelector('.journey__rule'),
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.5,
            ease: 'expo.out',
            scrollTrigger: { trigger: entry, start: 'top 82%', once: true },
          }
        );
        gsap.fromTo(
          entry.querySelectorAll('.journey__facts > *, .journey__link'),
          { y: 26, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            stagger: 0.08,
            scrollTrigger: { trigger: entry, start: 'top 72%', once: true },
          }
        );

        const figure = entry.querySelector('.journey__plate');
        plateReveal(figure?.querySelector('img'), figure);
        parallax(figure?.querySelector('img'), 70);
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="journeys"
      className="section journeys on-light"
      data-chapter="journeys"
      data-bg="#f3efe6"
      ref={ref}
    >
      <div className="wrap">
        <header className="journeys__head">
          <span className="numeral">Journeys</span>
          <TextReveal
            as="h2"
            className="display display--md journeys__title"
            lines={['Three we would', 'book ourselves.']}
          />
          <TextReveal
            as="p"
            className="body-text journeys__lede"
            text="Everything is private and everything is movable. These are starting points, not packages — most people change half of it before they go."
          />
        </header>

        <div className="journeys__list">
          {JOURNEYS.map((journey) => (
            <article className="journey" key={journey.index}>
              <div className="journey__rule rule" />

              <div className="journey__body">
                <div className="journey__facts numeral">
                  <span>{journey.index}</span>
                  <span>{journey.region}</span>
                  <span>{journey.nights}</span>
                </div>

                <TextReveal
                  as="h3"
                  className="display journey__name"
                  lines={[journey.name]}
                />

                <TextReveal
                  as="p"
                  className="body-text journey__copy"
                  text={journey.body}
                />

                <div className="journey__foot">
                  <span className="numeral journey__price">{journey.from}</span>
                  <a className="journey__link" href="#enquire" data-cursor="link">
                    Enquire
                    <ArrowUpRight size={13} strokeWidth={1.25} />
                  </a>
                </div>
              </div>

              <figure className={`journey__plate journey__plate--${journey.shape}`}>
                <img
                  src={journey.plate}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  data-cursor="view"
                />
              </figure>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
