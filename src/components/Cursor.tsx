/**
 * Cursor — a hairline ring that lags the pointer and opens over anything
 * marked `data-cursor`. Fine-pointer devices only; never mounted on touch.
 */

import { useEffect, useRef } from 'react';
import { gsap } from '../animations/gsap';
import '../styles/cursor.css';

export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });

    let visible = false;

    const move = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([ring, dot], { opacity: 1, duration: 0.4 });
      }
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);

      const hit = (e.target as HTMLElement | null)?.closest?.('[data-cursor]');
      const mode = hit?.getAttribute('data-cursor') ?? null;
      setMode(mode);
    };

    let currentMode: string | null = null;
    const setMode = (mode: string | null) => {
      if (mode === currentMode) return;
      currentMode = mode;
      gsap.to(ring, {
        scale: mode === 'view' ? 3.6 : mode ? 1.9 : 1,
        borderColor:
          mode === 'view' ? 'rgba(236,231,223,0.9)' : 'rgba(236,231,223,0.45)',
        duration: 0.5,
        ease: 'power3.out',
      });
      gsap.to(dot, { opacity: mode ? 0 : 1, duration: 0.3 });
      ring.dataset.mode = mode ?? '';
    };

    const leave = () => {
      visible = false;
      gsap.to([ring, dot], { opacity: 0, duration: 0.3 });
    };

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);

    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <>
      <div className="cursor-ring" ref={ringRef}>
        <span>View</span>
      </div>
      <div className="cursor-dot" ref={dotRef} />
    </>
  );
}
