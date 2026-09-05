/**
 * render.mjs - renders the frame sequences and stills into public/.
 * Usage: node tools/render.mjs [--bench]
 */
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { RENDERERS, PARAMS } from './engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SS = 1.5; // supersample factor, downscaled by sharp for anti-aliasing

/* -------------------------------------------------------------- */

async function renderJob(job) {
  const { scene, w, h, u, out, quality } = job;
  const rw = Math.round(w * SS);
  const rh = Math.round(h * SS);
  const render = RENDERERS[scene];
  const p = PARAMS[scene](u);
  const buf = Buffer.allocUnsafe(rw * rh * 3);
  let i = 0;
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const c = render(x, y, rw, rh, p);
      buf[i++] = (c[0] * 255 + 0.5) | 0;
      buf[i++] = (c[1] * 255 + 0.5) | 0;
      buf[i++] = (c[2] * 255 + 0.5) | 0;
    }
  }
  await sharp(buf, { raw: { width: rw, height: rh, channels: 3 } })
    .resize(w, h, { kernel: 'lanczos3' })
    .webp({ quality, effort: 5, smartSubsample: true })
    .toFile(out);
}

/* -------------------------------------------------------------- */

if (!isMainThread) {
  parentPort.on('message', async (job) => {
    if (job === null) {
      parentPort.close();
      return;
    }
    try {
      await renderJob(job);
      parentPort.postMessage({ ok: true, out: job.out });
    } catch (err) {
      parentPort.postMessage({ ok: false, out: job.out, err: String(err) });
    }
  });
} else {
  const pad = (n) => String(n).padStart(3, '0');

  function sequence(scene, dir, count, w, h, quality) {
    const jobs = [];
    for (let i = 1; i <= count; i++) {
      jobs.push({
        scene,
        w,
        h,
        quality,
        u: count === 1 ? 0 : (i - 1) / (count - 1),
        out: path.join(ROOT, 'public', dir, `frame_${pad(i)}.webp`),
      });
    }
    return jobs;
  }

  const jobs = [
    ...sequence('A', 'frames/obsidian', 60, 1440, 810, 76),
    ...sequence('A', 'frames/obsidian-mobile', 30, 828, 1104, 74),
    ...sequence('B', 'frames/drape', 48, 1440, 810, 76),
    ...sequence('B', 'frames/drape-mobile', 24, 828, 1104, 74),
    // editorial stills, pulled from the same two scenes at chosen moments
    { scene: 'A', w: 1800, h: 1200, quality: 82, u: 0.34, out: path.join(ROOT, 'public', 'stills', 'plate-01.webp') },
    { scene: 'B', w: 1800, h: 1200, quality: 82, u: 0.62, out: path.join(ROOT, 'public', 'stills', 'plate-02.webp') },
    { scene: 'A', w: 2400, h: 1350, quality: 84, u: 0.88, out: path.join(ROOT, 'public', 'stills', 'plate-03.webp') },
    { scene: 'B', w: 1400, h: 1750, quality: 82, u: 0.24, out: path.join(ROOT, 'public', 'stills', 'plate-04.webp') },
  ];

  const bench = process.argv.includes('--bench');
  const queue = bench ? [jobs[0]] : jobs;

  for (const dir of new Set(queue.map((j) => path.dirname(j.out)))) {
    await mkdir(dir, { recursive: true });
  }

  const started = Date.now();
  let done = 0;
  const total = queue.length;
  const workerCount = Math.min(bench ? 1 : Math.max(1, os.cpus().length - 2), total);
  const self = fileURLToPath(import.meta.url);

  await new Promise((resolve, reject) => {
    let alive = workerCount;
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(self);
      const next = () => {
        const job = queue.shift();
        if (!job) {
          worker.postMessage(null);
          worker.terminate();
          if (--alive === 0) resolve();
          return;
        }
        worker.postMessage(job);
      };
      worker.on('message', (msg) => {
        done++;
        if (!msg.ok) console.error('FAIL', msg.out, msg.err);
        const secs = ((Date.now() - started) / 1000).toFixed(1);
        console.log(`[${done}/${total}] ${secs}s  ${path.relative(ROOT, msg.out)}`);
        next();
      });
      worker.on('error', reject);
      next();
    }
  });

  console.log(`done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}
