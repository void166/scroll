/**
 * StorySection — five viewports, one sticky plate, three statements.
 *
 * The whole scene is a single scrubbed timeline with hand-placed beats. Text
 * is always fully out before the next block starts, so the eye is never asked
 * to read two things at once.
 *
 *   0.00 – 0.14  plate opens from an inset crop
 *   0.14 – 0.30  beat one in                    0.30 – 0.36  out
 *   0.30 – 0.52  plate drifts left, rotates off-axis
 *   0.38 – 0.54  beat two in                    0.54 – 0.60  out
 *   0.58 – 0.78  plate drifts right, pushes in
 *   0.62 – 0.78  beat three in                  0.78 – 0.84  out
 *   0.84 – 1.00  plate scales down and releases the section
 */

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { STORY_BEATS, PLATES } from '../data/scenes';
import '../styles/story.css';

const BEAT_WINDOWS = [
  { in: 0.14, out: 0.3 },
  { in: 0.38, out: 0.54 },
  { in: 0.62, out: 0.78 },
];

export function StorySection() {
  const ref = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate: (self) => {
            // Written straight to the DOM — this fires on every scroll tick.
            if (progressRef.current) {
              progressRef.current.textContent = String(
                Math.round(self.progress * 100)
              ).padStart(3, '0');
            }
          },
        },
      });

      /* --- the plate ---------------------------------------------------- */
      tl.fromTo(
        '.story__plate',
        {
          clipPath: 'inset(22% 26% 22% 26%)',
          scale: 1.3,
          filter: 'blur(8px) brightness(0.7)',
        },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          scale: 1.08,
          filter: 'blur(0px) brightness(1)',
          ease: 'power2.out',
          duration: 0.16,
        },
        0
      )
        .to(
          '.story__plate',
          { xPercent: -6, yPercent: 2, rotate: -1.6, scale: 1.02, ease: 'sine.inOut', duration: 0.22 },
          0.3
        )
        .to(
          '.story__plate',
          { xPercent: 5, yPercent: -3, rotate: 1.1, scale: 1.12, ease: 'sine.inOut', duration: 0.2 },
          0.58
        )
        .to(
          '.story__plate',
          { scale: 0.82, yPercent: 0, xPercent: 0, rotate: 0, filter: 'blur(2px) brightness(0.55)', ease: 'power2.inOut', duration: 0.16 },
          0.84
        );

      // Vignette breathes with the drift.
      tl.fromTo(
        '.story__shade',
        { opacity: 0.15 },
        { opacity: 0.62, ease: 'none', duration: 1 },
        0
      );

      /* --- the beats ---------------------------------------------------- */
      BEAT_WINDOWS.forEach((win, i) => {
        const beat = `.story__beat[data-beat="${i}"]`;

        tl.fromTo(
          `${beat} .reveal-line > span`,
          { yPercent: 108, opacity: 0, filter: 'blur(7px)' },
          {
            yPercent: 0,
            opacity: 1,
            filter: 'blur(0px)',
            ease: 'expo.out',
            duration: 0.09,
            stagger: 0.012,
          },
          win.in
        )
          .fromTo(
            `${beat} .story__beat-meta, ${beat} .story__beat-body`,
            { y: 26, opacity: 0 },
            { y: 0, opacity: 1, ease: 'power2.out', duration: 0.07, stagger: 0.01 },
            win.in + 0.03
          )
          .to(
            `${beat} .reveal-line > span`,
            {
              yPercent: -105,
              opacity: 0,
              filter: 'blur(7px)',
              ease: 'power2.in',
              duration: 0.06,
              stagger: 0.008,
            },
            win.out
          )
          .to(
            `${beat} .story__beat-meta, ${beat} .story__beat-body`,
            { y: -22, opacity: 0, ease: 'power2.in', duration: 0.05 },
            win.out
          );
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="story"
      className="section story"
      data-chapter="story"
      data-bg="#0a0a0b"
      ref={ref}
    >
      <div className="story__stage">
        <div className="story__frame">
          <img
            className="story__plate"
            src={PLATES.three}
            alt=""
            decoding="async"
          />
          <div className="story__shade" />
        </div>

        <div className="story__copy wrap">
          {STORY_BEATS.map((beat, i) => (
            <article className="story__beat" data-beat={i} key={beat.index}>
              <div className="story__beat-meta numeral">
                <span>{beat.index}</span>
                <span>{beat.kicker}</span>
              </div>

              <h2 className="display display--lg story__beat-title">
                {beat.line.map((line, j) => (
                  <span className="reveal-line" key={j}>
                    <span>{line}</span>
                  </span>
                ))}
              </h2>

              <p className="body-text story__beat-body">{beat.body}</p>
            </article>
          ))}
        </div>

        <div className="story__hud numeral">
          <span>The Turning</span>
          <span ref={progressRef}>000</span>
        </div>
      </div>
    </section>
  );
}
