/**
 * SequenceSection — the second reel. Same FrameSequence component, different
 * spec, different framing: full bleed, with a live frame read-out.
 *
 * The counter is proof of the architecture — it updates on every scroll tick
 * by writing textContent, and React never re-renders.
 */

import { useCallback, useLayoutEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { FrameSequence } from './FrameSequence';
import { SEQUENCES } from '../data/scenes';
import '../styles/sequence.css';

const CAPTIONS = [
  { at: 0.0, text: 'The surface at rest' },
  { at: 0.34, text: 'First fold' },
  { at: 0.63, text: 'The light runs off the edge' },
  { at: 0.86, text: 'Held' },
];

export function SequenceSection() {
  const ref = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const captionIndex = useRef(-1);

  const onProgress = useCallback(
    (progress: number, frame: number, total: number) => {
      if (counterRef.current) {
        counterRef.current.textContent = `${String(Math.round(frame) + 1).padStart(
          3,
          '0'
        )} / ${String(total).padStart(3, '0')}`;
      }
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }

      // Caption swaps are the only discrete event in the scene.
      let next = 0;
      for (let i = CAPTIONS.length - 1; i >= 0; i--) {
        if (progress >= CAPTIONS[i].at) {
          next = i;
          break;
        }
      }
      if (next !== captionIndex.current && captionRef.current) {
        captionIndex.current = next;
        const el = captionRef.current;
        gsap.killTweensOf(el);
        gsap
          .timeline()
          .to(el, { yPercent: -110, opacity: 0, duration: 0.28, ease: 'power2.in' })
          .call(() => {
            el.textContent = CAPTIONS[next].text;
          })
          .fromTo(
            el,
            { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.55, ease: 'expo.out' }
          );
      }
    },
    []
  );

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      tl.fromTo(
        '.sequence__canvas-wrap',
        { scale: 1.16, filter: 'blur(6px)', opacity: 0.4 },
        { scale: 1, filter: 'blur(0px)', opacity: 1, ease: 'power2.out', duration: 0.16 },
        0
      )
        .fromTo(
          '.sequence__title',
          { opacity: 0, yPercent: 60, filter: 'blur(12px)' },
          { opacity: 1, yPercent: 0, filter: 'blur(0px)', ease: 'expo.out', duration: 0.14 },
          0.06
        )
        .to(
          '.sequence__title',
          { opacity: 0, yPercent: -50, filter: 'blur(8px)', ease: 'power2.in', duration: 0.12 },
          0.3
        )
        .fromTo(
          '.sequence__hud',
          { opacity: 0 },
          { opacity: 1, duration: 0.08 },
          0.12
        )
        .to(
          '.sequence__canvas-wrap',
          { scale: 1.1, opacity: 0.25, filter: 'blur(5px)', ease: 'power2.in', duration: 0.14 },
          0.86
        )
        .to('.sequence__hud', { opacity: 0, duration: 0.08 }, 0.88);
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="sequence"
      className="section sequence"
      data-chapter="sequence"
      data-bg="#0a0a0b"
      ref={ref}
    >
      <div className="sequence__stage">
        <div className="sequence__canvas-wrap">
          <FrameSequence
            spec={SEQUENCES.drape}
            trigger={ref}
            start="top top"
            end="bottom bottom"
            scrub={0.7}
            className="sequence__canvas"
            onProgress={onProgress}
          />
        </div>

        <h2 className="display display--lg sequence__title">
          Drape,
          <br />
          <span className="italic">in one take</span>
        </h2>

        <div className="sequence__hud">
          <div className="sequence__caption">
            <span ref={captionRef}>{CAPTIONS[0].text}</span>
          </div>

          <div className="sequence__track">
            <span ref={barRef} />
          </div>

          <span className="numeral sequence__count" ref={counterRef}>
            001 / 048
          </span>
        </div>
      </div>
    </section>
  );
}
