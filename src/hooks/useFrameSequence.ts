/**
 * useFrameSequence — drives a canvas from a 0→1 progress value.
 *
 * The hook deliberately holds *no* React state. Progress arrives from a GSAP
 * scrub via the returned controller, which mutates a plain object and paints.
 * A scroll therefore costs one canvas blit, never a render pass.
 */

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { getSequence, frameCount, IS_COMPACT } from '../lib/frameLoader';
import type { SequenceSpec } from '../data/scenes';

export interface FrameController {
  /** 0 → 1 across the sequence */
  setProgress: (value: number) => void;
  /** repaint at the current progress (resize, late decode) */
  redraw: () => void;
  /** current fractional frame, for read-outs */
  readonly frame: number;
  readonly total: number;
}

/** Retina is nice; 3× on a 6.5" phone is not worth the fill rate. */
const maxDpr = () => (IS_COMPACT ? 2 : 2);

export function useFrameSequence(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  spec: SequenceSpec
): FrameController {
  const total = frameCount(spec);

  // Mutable render state — intentionally outside React's world.
  const state = useRef({ progress: 0, w: 0, h: 0 });
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const controller = useMemo<FrameController>(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const images = getSequence(spec.id);
      if (!canvas || !ctx || !images.length) return;

      const { w, h } = state.current;
      if (!w || !h) return;

      const exact = state.current.progress * (images.length - 1);
      const base = Math.min(images.length - 1, Math.max(0, Math.floor(exact)));
      const next = Math.min(images.length - 1, base + 1);
      const blend = exact - base;

      ctx.clearRect(0, 0, w, h);
      paint(ctx, images[base], w, h, 1);
      // Cross-dissolving neighbours turns 60 stills into a continuous move.
      if (blend > 0.004 && next !== base) {
        paint(ctx, images[next], w, h, blend);
      }
    };

    return {
      setProgress(value: number) {
        const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
        if (clamped === state.current.progress) return;
        state.current.progress = clamped;
        draw();
      },
      redraw: draw,
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

    ctxRef.current = canvas.getContext('2d', { alpha: true });

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr());
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

    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', resize);
      ctxRef.current = null;
    };
  }, [canvasRef, controller]);

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
