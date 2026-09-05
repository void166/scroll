/**
 * Enquire — the one thing the page is asking for. A mailto rather than a
 * fake form: there is no backend, and a form that silently does nothing is
 * worse than no form.
 */

import { useLayoutEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap } from '../animations/gsap';
import { revealLines, fadeUp } from '../animations/scrollAnimations';
import { TextReveal } from './TextReveal';
import { BRAND } from '../data/site';
import '../styles/enquire.css';

export function Enquire() {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      revealLines('.enquire__title', {
        trigger: ref.current!,
        start: 'top 66%',
        stagger: 0.13,
        duration: 1.7,
        y: 110,
      });
      fadeUp('.enquire__row, .enquire__cta', {
        trigger: ref.current!,
        start: 'top 60%',
        delay: 0.35,
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  const subject = encodeURIComponent('Journey enquiry');

  return (
    <section
      id="enquire"
      className="section enquire on-light"
      data-chapter="enquire"
      data-bg="#f3efe6"
      ref={ref}
    >
      <div className="wrap enquire__inner">
        <span className="numeral">Enquire</span>

        <TextReveal
          as="h2"
          className="display display--lg enquire__title"
          lines={['Tell us when', 'you can leave.']}
        />

        <div className="enquire__row">
          <p className="body-text">
            Write with rough dates and how long you have. We reply within a
            working day, usually with questions before suggestions.
          </p>
        </div>

        <a
          className="enquire__cta"
          href={`mailto:${BRAND.email}?subject=${subject}`}
          data-cursor="link"
        >
          <span>{BRAND.email}</span>
          <ArrowUpRight size={20} strokeWidth={1} />
        </a>

        <div className="enquire__row enquire__meta">
          <span className="numeral">{BRAND.phone}</span>
          <span className="numeral">{BRAND.address.join(' · ')}</span>
        </div>
      </div>
    </section>
  );
}
