/**
 * Navigation — fixed, hairline, and blended so it stays legible over both the
 * ink and the bone sections without ever changing colour itself.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { gsap } from '../animations/gsap';
import { trackChapters } from '../animations/scrollAnimations';
import { CHAPTERS } from '../data/scenes';
import '../styles/navigation.css';

interface Props {
  ready: boolean;
}

export function Navigation({ ready }: Props) {
  const [chapter, setChapter] = useState<string>(CHAPTERS[0].id);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const index = Math.max(
    0,
    CHAPTERS.findIndex((c) => c.id === chapter)
  );
  const current = CHAPTERS[index];

  useEffect(() => {
    if (!ready) return;
    const triggers = trackChapters(setChapter);
    return () => triggers.forEach((t) => t.kill());
  }, [ready]);

  // Reveal the bar once the curtain has lifted.
  useLayoutEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      gsap.from('.nav__item', {
        yPercent: -120,
        opacity: 0,
        duration: 1.1,
        stagger: 0.08,
        ease: 'expo.out',
        delay: 0.15,
      });
    }, rootRef);
    return () => ctx.revert();
  }, [ready]);

  // Swap the chapter label without a layout jump.
  useEffect(() => {
    if (!labelRef.current) return;
    gsap.fromTo(
      labelRef.current,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }
    );
  }, [chapter]);

  // Overlay menu.
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;

    const links = el.querySelectorAll('.menu__link > span');
    if (open) {
      gsap
        .timeline()
        .set(el, { pointerEvents: 'auto' })
        .to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' })
        .fromTo(
          links,
          { yPercent: 115, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.05, ease: 'expo.out' },
          '-=0.45'
        );
    } else {
      gsap
        .timeline()
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.7, ease: 'expo.inOut' })
        .set(el, { pointerEvents: 'none' });
    }
  }, [open]);

  const goTo = (id: string) => {
    setOpen(false);
    const target = document.getElementById(id);
    if (!target) return;
    // Native smooth scroll keeps ScrollTrigger perfectly in sync — no plugin.
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <header className="nav" ref={rootRef}>
        <div className="nav__item nav__brand">
          <button onClick={() => goTo('hero')} data-cursor="link">
            Vela&nbsp;Armon
          </button>
        </div>

        <div className="nav__item nav__chapter" aria-live="polite">
          <span className="nav__index numeral">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="nav__label-mask">
            <span ref={labelRef}>{current.label}</span>
          </span>
          <span className="nav__index numeral">
            {String(CHAPTERS.length).padStart(2, '0')}
          </span>
        </div>

        <div className="nav__item nav__menu">
          <button
            onClick={() => setOpen((v) => !v)}
            data-cursor="link"
            aria-expanded={open}
          >
            <span>{open ? 'Close' : 'Index'}</span>
            {open ? <Minus size={13} strokeWidth={1.25} /> : <Plus size={13} strokeWidth={1.25} />}
          </button>
        </div>
      </header>

      <div className="menu" ref={menuRef}>
        <nav className="menu__list">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              className="menu__link"
              onClick={() => goTo(c.id)}
              data-cursor="link"
            >
              <span>
                <i className="numeral">{String(i + 1).padStart(2, '0')}</i>
                {c.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
