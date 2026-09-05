/**
 * Film — the whole journey as one continuous reel.
 *
 * A single 480-frame sequence is scrubbed across ~9 screens of scroll while
 * the canvas stays pinned. Five chapters of copy fade through on top of it,
 * each mapped to its own fifth of the reel:
 *
 *   0 – 20%   takeoff      20 – 40%  coastline    40 – 60%  lagoon
 *   60 – 80%  arrival      80 – 100% last light
 *
 * Chapter windows come from data/site.ts, so re-cutting the film is a data
 * change, not a code change.
 */

import { useCallback, useLayoutEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { revealLines } from '../animations/scrollAnimations';
import { FrameSequence } from './FrameSequence';
import { JOURNEY, CHAPTERS, BRAND } from '../data/site';
import '../styles/film.css';

/** Fractions of each chapter's window spent bringing copy in and out. */
const IN_AT = 0.12;
const HOLD_TO = 0.74;

interface Props {
  /** the curtain has lifted; play the opening titles */
  ready: boolean;
}

export function Film({ ready }: Props) {
  const ref = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const onProgress = useCallback((progress: number, frame: number, total: number) => {
    // Written straight to the DOM — this fires on every scroll tick.
    if (counterRef.current) {
      counterRef.current.textContent = `${String(Math.round(frame) + 1).padStart(
        3,
        '0'
      )} / ${total}`;
    }
    if (barRef.current) {
      barRef.current.style.transform = `scaleX(${progress})`;
    }
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;

    const ctx = gsap.context(() => {
      revealLines('.film__title', { immediate: true, delay: 0.15, stagger: 0.12 });

      gsap.from('.film__intro .eyebrow, .film__cue', {
        opacity: 0,
        y: 24,
        duration: 1.4,
        stagger: 0.12,
        delay: 0.45,
      });

      gsap.from('.film__hud', { opacity: 0, duration: 1.6, delay: 0.8 });

      gsap.from('.film__canvas-wrap', {
        scale: 1.12,
        filter: 'blur(12px)',
        duration: 2.2,
        ease: 'expo.out',
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      // Opening titles clear out of the way as the first chapter takes over.
      tl.to('.film__intro', {
        opacity: 0,
        yPercent: -30,
        filter: 'blur(10px)',
        ease: 'power2.in',
        duration: 0.05,
      }, 0.02);

      CHAPTERS.forEach((chapter) => {
        const span = chapter.end - chapter.start;
        const inAt = chapter.start + span * IN_AT;
        const outAt = chapter.start + span * HOLD_TO;
        const sel = `.chapter[data-chapter="${chapter.id}"]`;

        tl.fromTo(
          `${sel} .reveal-line > span`,
          { yPercent: 110, opacity: 0, filter: 'blur(8px)' },
          {
            yPercent: 0,
            opacity: 1,
            filter: 'blur(0px)',
            ease: 'expo.out',
            duration: span * 0.34,
            stagger: span * 0.05,
          },
          inAt
        )
          .fromTo(
            `${sel} .chapter__meta, ${sel} .chapter__body`,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: 'power2.out',
              duration: span * 0.26,
              stagger: span * 0.04,
            },
            inAt + span * 0.08
          )
          .to(
            `${sel} .reveal-line > span`,
            {
              yPercent: -105,
              opacity: 0,
              filter: 'blur(8px)',
              ease: 'power2.in',
              duration: span * 0.2,
              stagger: span * 0.03,
            },
            outAt
          )
          .to(
            `${sel} .chapter__meta, ${sel} .chapter__body`,
            { y: -24, opacity: 0, ease: 'power2.in', duration: span * 0.16 },
            outAt
          );
      });

      /*
       * The scrim is two mirrored gradients. Only the side the copy is on
       * lights up, so the other three quarters of the frame stay as bright
       * as the footage actually is.
       */
      CHAPTERS.forEach((chapter) => {
        const span = chapter.end - chapter.start;
        const near = chapter.align === 'right' ? '.film__scrim--right' : '.film__scrim--left';
        const far = chapter.align === 'right' ? '.film__scrim--left' : '.film__scrim--right';

        tl.to(near, { opacity: 1, ease: 'sine.inOut', duration: span * 0.3 },
            chapter.start + span * IN_AT)
          .to(far, { opacity: 0, ease: 'sine.inOut', duration: span * 0.3 },
            chapter.start + span * IN_AT)
          .to(near, { opacity: 0.22, ease: 'sine.inOut', duration: span * 0.22 },
            chapter.start + span * HOLD_TO);
      });
    }, ref);

    return () => ctx.revert();
  }, [ready]);

  return (
    <section
      id="film"
      className="section film"
      data-chapter="film"
      data-bg="#0b0f12"
      ref={ref}
    >
      <div className="film__stage">
        <div className="film__canvas-wrap">
          <FrameSequence
            spec={JOURNEY}
            trigger={ref}
            start="top top"
            end="bottom bottom"
            scrub={0.7}
            className="film__canvas"
            onProgress={onProgress}
          />
        </div>

        <div className="film__scrim film__scrim--left" />
        <div className="film__scrim film__scrim--right" />

        <div className="film__intro wrap">
          <p className="eyebrow">{BRAND.descriptor}</p>
          <h1 className="display display--xl film__title">
            <span className="reveal-line"><span>Nine hours</span></span>
            <span className="reveal-line"><span>from anywhere</span></span>
            <span className="reveal-line"><span className="italic">worth leaving.</span></span>
          </h1>
          <div className="film__cue">
            <span className="numeral">Scroll to fly</span>
            <span className="film__cue-line" />
          </div>
        </div>

        <div className="film__copy wrap">
          {CHAPTERS.map((chapter) => (
            <article
              className={`chapter chapter--${chapter.align}`}
              data-chapter={chapter.id}
              key={chapter.id}
            >
              <div className="chapter__meta numeral">
                <span className="chapter__index">{chapter.index}</span>
                <span>{chapter.label}</span>
              </div>

              <h2 className="display display--lg chapter__title">
                {chapter.lines.map((line, i) => (
                  <span className="reveal-line" key={i}>
                    <span>{line}</span>
                  </span>
                ))}
              </h2>

              <p className="chapter__body">{chapter.body}</p>
            </article>
          ))}
        </div>

        <div className="film__hud">
          <div className="film__track">
            <span ref={barRef} />
          </div>
          <span className="numeral film__count" ref={counterRef}>
            001
          </span>
        </div>
      </div>
    </section>
  );
}
