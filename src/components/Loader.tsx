/**
 * Loader — a counting title card, not a spinner.
 *
 * The digits are written straight to the DOM from a GSAP tween so the count
 * runs at 60fps regardless of how lumpy the network progress is.
 */

import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import '../styles/loader.css';

interface Props {
  /** 0 → 1 */
  progress: number;
  /** fires once the curtain has cleared the viewport */
  onComplete: () => void;
}

export function Loader({ progress, onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const shown = useRef({ value: 0 });
  const exited = useRef(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Opening card.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.loader__line > span', {
        yPercent: 110,
        opacity: 0,
        duration: 1.2,
        stagger: 0.08,
        ease: 'expo.out',
      });
      gsap.from('.loader__rule', {
        scaleX: 0,
        duration: 1.4,
        ease: 'expo.out',
        delay: 0.15,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Ease the read-out toward the real figure.
  useEffect(() => {
    const tween = gsap.to(shown.current, {
      value: progress,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: () => {
        const pct = Math.round(shown.current.value * 100);
        if (countRef.current) {
          countRef.current.textContent = String(pct).padStart(3, '0');
        }
        if (barRef.current) {
          barRef.current.style.transform = `scaleX(${shown.current.value})`;
        }
      },
    });
    return () => {
      tween.kill();
    };
  }, [progress]);

  // Exit once the count has actually caught up with 100.
  useEffect(() => {
    if (progress < 1 || exited.current) return;

    const check = setInterval(() => {
      if (shown.current.value < 0.999 || exited.current) return;
      clearInterval(check);
      exited.current = true;

      const tl = gsap.timeline({
        defaults: { ease: 'expo.inOut' },
        onComplete: () => onCompleteRef.current(),
      });

      tl.to('.loader__meta', { opacity: 0, duration: 0.5, ease: 'power2.out' })
        .to('.loader__rule', { scaleX: 0, transformOrigin: 'right', duration: 0.8 }, '<')
        .to(
          '.loader__line > span',
          { yPercent: -110, duration: 1, stagger: 0.06 },
          '-=0.5'
        )
        .to(
          rootRef.current,
          { yPercent: -100, duration: 1.25 },
          '-=0.55'
        );
    }, 60);

    return () => clearInterval(check);
  }, [progress]);

  return (
    <div className="loader" ref={rootRef}>
      <div className="loader__inner">
        <h1 className="loader__title display display--md">
          <span className="loader__line">
            <span>Vela</span>
          </span>
          <span className="loader__line">
            <span className="italic">Armon</span>
          </span>
        </h1>

        <div className="loader__meta">
          <span className="numeral">Collection No. 07</span>
          <span className="loader__count numeral" ref={countRef}>
            000
          </span>
        </div>

        <div className="loader__rule">
          <span ref={barRef} />
        </div>
      </div>
    </div>
  );
}
