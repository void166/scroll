/**
 * useFrameSequence — drives a canvas from a 0→1 progress value.
 *
 * The hook deliberately holds *no* React state. Progress arrives from a GSAP
 * scrub via the returned controller, which mutates a plain object and paints.
 * A scroll therefore costs one canvas blit, never a render pass.
 *
 * Frames may not all be present yet (see lib/frameLoader): the draw falls
 * back to the nearest decoded frame, and reports the playhead so the streamer
 * fetches ahead of the viewer.
 */

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import {
  getSequence,
  frameCount,
  nearestReady,
  setPlayhead,
  streamProgress,
} from '../lib/frameLoader';
import type { SequenceSpec } from '../data/site';

export interface FrameController {
  /** 0 → 1 across the sequence */
  setProgress: (value: number) => void;
  /** repaint at the current progress (resize, late decode) */
  redraw: () => void;
  readonly frame: number;
  readonly total: number;
}

/** Retina is nice; 3× on a phone is not worth the fill rate. */
/* Past the source resolution there is nothing to gain: a bigger backing
   store just interpolates the same pixels and looks softer, not sharper. */
const MAX_DPR = 1.5;

export function useFrameSequence(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  spec: SequenceSpec
): FrameController {
  const total = frameCount(spec);

  // Mutable render state — intentionally outside React's world.
  const state = useRef({ progress: 0, w: 0, h: 0, drawn: -1 });
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const controller = useMemo<FrameController>(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const seq = getSequence(spec.id);
      if (!canvas || !ctx || !seq) return;

      const { w, h } = state.current;
      if (!w || !h) return;

      const exact = state.current.progress * (seq.count - 1);
      const base = Math.min(seq.count - 1, Math.max(0, Math.floor(exact)));
      const blend = exact - base;

      setPlayhead(spec.id, base);

      // Fall back to whatever is decoded nearest this point in the reel.
      const shown = seq.ready[base] ? base : nearestReady(seq, base);
      if (shown < 0) return;

      const next = base + 1;
      const canBlend =
        shown === base && next < seq.count && seq.ready[next] && blend > 0.004;

      // Skip the blit entirely when nothing would change.
      if (!canBlend && shown === state.current.drawn) return;
      state.current.drawn = canBlend ? -1 : shown;

      ctx.clearRect(0, 0, w, h);
      paint(ctx, seq.images[shown], w, h, 1);
      // Cross-dissolving neighbours turns stills into continuous movement.
      if (canBlend) paint(ctx, seq.images[next], w, h, blend);
    };

    return {
      setProgress(value: number) {
        const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
        state.current.progress = clamped;
        draw();
      },
      redraw() {
        state.current.drawn = -1;
        draw();
      },
      get frame() {
        return state.current.progress * (total - 1);
      },
      get total() {
        return total;
      },
    };
  }, [canvasRef, spec.id, total]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current = canvas.getContext('2d', { alpha: false });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (w === state.current.w && h === state.current.h) return;

      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      state.current.w = w;
      state.current.h = h;
      controller.redraw();
    };

    resize();

    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    window.addEventListener('orientationchange', resize);

    // Frames keep arriving after mount; repaint as the reel fills in so the
    // picture sharpens even while the viewer is holding still. Stops once
    // there is nothing left to arrive.
    const fill = window.setInterval(() => {
      controller.redraw();
      if (streamProgress(spec.id) >= 1) window.clearInterval(fill);
    }, 400);

    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', resize);
      window.clearInterval(fill);
      ctxRef.current = null;
    };
  }, [canvasRef, controller, spec.id]);

  return controller;
}

/** Cover-fit: fill the canvas, centre the overflow, never distort. */
function paint(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  w: number,
  h: number,
  alpha: number
) {
  if (!img || !img.naturalWidth) return;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.globalAlpha = 1;
}
