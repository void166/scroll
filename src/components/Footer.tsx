/**
 * Footer — the colophon. A wordmark that fills the measure, three columns of
 * hairline type, and nothing that could be mistaken for a call to action.
 */

import { useLayoutEffect, useRef } from 'react';
import { ArrowUpRight, ArrowUp } from 'lucide-react';
import { gsap } from '../animations/gsap';
import { fadeUp, revealLines } from '../animations/scrollAnimations';
import '../styles/footer.css';

const COLUMNS = [
  {
    title: 'Studio',
    items: ['12 Rue Barbette', 'Paris III', 'By appointment'],
  },
  {
    title: 'Enquiries',
    items: ['studio@velaarmon.com', '+33 1 44 78 12 33'],
  },
];

const LINKS = ['Instagram', 'Journal', 'Stockists'];

export function Footer() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      revealLines('.footer__mark', {
        trigger: ref.current!,
        start: 'top 88%',
        y: 105,
        duration: 1.6,
      });
      fadeUp('.footer__col', { trigger: ref.current!, start: 'top 85%' });
      gsap.fromTo(
        '.footer__rule',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 92%', once: true },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      className="section footer"
      data-bg="#0a0a0b"
      /* Hold the bone until the closing statement has actually left. */
      data-bg-start="top 65%"
      data-bg-end="top 22%"
      ref={ref}
    >
      <div className="wrap">
        <div className="footer__rule rule" />

        <div className="footer__grid">
          {COLUMNS.map((col) => (
            <div className="footer__col" key={col.title}>
              <span className="numeral">{col.title}</span>
              <ul>
                {col.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer__col">
            <span className="numeral">Elsewhere</span>
            <ul>
              {LINKS.map((link) => (
                <li key={link}>
                  <a href="#" data-cursor="link" className="footer__link">
                    {link}
                    <ArrowUpRight size={12} strokeWidth={1.25} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col footer__col--top">
            <button
              data-cursor="link"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="footer__link"
            >
              <ArrowUp size={12} strokeWidth={1.25} />
              Back to the opening
            </button>
          </div>
        </div>

        <h2 className="footer__mark display">
          <span className="reveal-line">
            <span>Vela Armon</span>
          </span>
        </h2>

        <div className="footer__base numeral">
          <span>© MMXXVI</span>
          <span>Collection No. 07 — Obsidian</span>
        </div>
      </div>
    </footer>
  );
}
