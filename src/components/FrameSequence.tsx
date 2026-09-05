/**
 * FrameSequence — a canvas whose frame index is bound to scroll position.
 *
 * Reusable across sections: point it at a spec, give it a trigger element and
 * a scroll window. It owns exactly one ScrollTrigger and reverts it on unmount
 * via gsap.context.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { gsap } from '../animations/gsap';
import { useFrameSequence } from '../hooks/useFrameSequence';
import type { SequenceSpec } from '../data/scenes';

export interface FrameSequenceHandle {
  /** the <canvas> itself, so parents can transform it on their own timelines */
  readonly canvas: HTMLCanvasElement | null;
}

interface Props {
  spec: SequenceSpec;
  /** element the scrub is measured against */
  trigger: React.RefObject<HTMLElement | null>;
  start?: string;
  end?: string;
  scrub?: number | boolean;
  className?: string;
  /**
   * Called on every scrub tick with 0→1 and the fractional frame.
   * Write to the DOM directly here — do not set React state.
   */
  onProgress?: (progress: number, frame: number, total: number) => void;
}

export const FrameSequence = forwardRef<FrameSequenceHandle, Props>(
  function FrameSequence(
    {
      spec,
      trigger,
      start = 'top top',
      end = 'bottom bottom',
      scrub = 0.6,
      className,
      onProgress,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const controller = useFrameSequence(canvasRef, spec);

    // Keep the latest callback without re-creating the ScrollTrigger.
    const progressCb = useRef(onProgress);
    useEffect(() => {
      progressCb.current = onProgress;
    }, [onProgress]);

    useImperativeHandle(ref, () => ({ get canvas() { return canvasRef.current; } }), []);

    /*
     * Passive, not layout. The trigger is an ancestor element, and React
     * attaches a parent's ref *after* its children's layout effects have
     * run — reading it there would hand us null and silently skip the
     * ScrollTrigger. Passive effects run once the whole tree is committed.
     */
    useEffect(() => {
      const el = trigger.current;
      if (!el) {
        console.warn('FrameSequence: trigger element not mounted');
        return;
      }

      const ctx = gsap.context(() => {
        const proxy = { value: 0 };

        gsap.to(proxy, {
          value: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start,
            end,
            scrub,
            invalidateOnRefresh: true,
          },
          onUpdate: () => {
            controller.setProgress(proxy.value);
            progressCb.current?.(
              proxy.value,
              controller.frame,
              controller.total
            );
          },
        });

        controller.redraw();
      });

      return () => ctx.revert();
    }, [controller, trigger, start, end, scrub]);

    return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
  }
);
