/**
 * frames.mjs — prepares the journey footage for the web.
 *
 * The source plates are 1920×1080 WebP at ~175 KB each: 84 MB for 480 frames,
 * which is not a thing you can put in front of a visitor. This re-encodes two
 * sets — a landscape set for desktop and a portrait centre-crop at half the
 * frame rate for phones — plus the stills used by the cards further down the
 * page.
 *
 *   node tools/frames.mjs [--src <dir>] [--quality 60]
 */
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = fileURLToPath(import.meta.url);

const DEFAULT_SRC =
  'C:/Users/My Tech/Desktop/haltuur/zuragai/web/frames';

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const pad4 = (n) => String(n).padStart(4, '0');

/* ------------------------------------------------------------------ *
 * Worker
 * ------------------------------------------------------------------ */

if (!isMainThread) {
  const { quality } = workerData;

  parentPort.on('message', async (job) => {
    if (job === null) return parentPort.close();
    try {
      let img = sharp(job.src, { failOn: 'none' });

      if (job.crop) {
        // Portrait: take the centre of the plate rather than letterboxing.
        img = img.resize(job.w, job.h, { fit: 'cover', position: 'centre' });
      } else {
        img = img.resize(job.w, job.h, { fit: 'cover' });
      }

      const q = job.quality ?? quality;
      img = job.out.endsWith('.jpg')
        ? img.jpeg({ quality: q, mozjpeg: true })
        : img.webp({ quality: q, effort: 4, smartSubsample: true });

      const info = await img.toFile(job.out);

      parentPort.postMessage({ ok: true, bytes: info.size, out: job.out });
    } catch (err) {
      parentPort.postMessage({ ok: false, out: job.out, err: String(err) });
    }
  });
} else {
  /* ---------------------------------------------------------------- *
   * Main
   * ---------------------------------------------------------------- */

  const SRC = arg('--src', DEFAULT_SRC);
  const QUALITY = Number(arg('--quality', 60));

  const files = (await readdir(SRC))
    .filter((f) => /^frame_\d+\.webp$/i.test(f))
    .sort();

  if (!files.length) {
    console.error(`No frames found in ${SRC}`);
    process.exit(1);
  }

  const srcPath = (i) => path.join(SRC, files[i]);

  console.log(`${files.length} source frames in ${SRC}`);

  const jobs = [];

  /*
   * Resolution beats frame count. Aerial footage is nearly all high-frequency
   * detail, so the quality slider barely moves file size — but the canvas
   * cross-dissolves neighbouring frames, which means half as many frames at
   * twice the detail looks identical in motion and sharper when still.
   *
   *   480 @ 1280×720 = 40 MB and visibly soft
   *   240 @ 1600×900 = 29 MB and sharp
   */
  let d = 0;
  for (let i = 0; i < files.length; i += 2) {
    jobs.push({
      src: srcPath(i),
      out: path.join(ROOT, 'public', 'frames', 'journey', `frame_${pad4(++d)}.webp`),
      w: 1600,
      h: 900,
      quality: 60,
    });
  }

  /*
   * Phones: a third of the frames, cropped to 2:3 — close enough to a phone's
   * own aspect that the canvas barely has to upscale, which is what actually
   * makes a frame look soft.
   */
  let m = 0;
  for (let i = 0; i < files.length; i += 3) {
    jobs.push({
      src: srcPath(i),
      out: path.join(ROOT, 'public', 'frames', 'journey-mobile', `frame_${pad4(++m)}.webp`),
      w: 960,
      h: 1440,
      crop: true,
      quality: 56,
    });
  }

  // Stills for the cards and the social image. Frame numbers are 1-based.
  const stills = [
    ['plate-takeoff', 40, 1600, 1000],
    ['plate-coastline', 176, 1600, 1000],
    ['plate-lagoon', 232, 1600, 1000],
    ['plate-arrival', 330, 1600, 1000],
    ['plate-sunset', 452, 1600, 1000],
    ['plate-portrait', 208, 1100, 1400],
  ];
  for (const [name, frame, w, h] of stills) {
    jobs.push({
      src: srcPath(Math.min(files.length - 1, frame - 1)),
      out: path.join(ROOT, 'public', 'stills', `${name}.webp`),
      w,
      h,
      crop: true,
      quality: 80,
    });
  }
  jobs.push({
    src: srcPath(175),
    out: path.join(ROOT, 'public', 'og.jpg'),
    w: 1200,
    h: 630,
    crop: true,
    quality: 84,
  });

  for (const dir of new Set(jobs.map((j) => path.dirname(j.out)))) {
    await mkdir(dir, { recursive: true });
  }

  const queue = jobs.slice();
  const total = queue.length;
  const workerCount = Math.min(Math.max(1, os.cpus().length - 2), total);
  const started = Date.now();
  let done = 0;
  let bytes = 0;
  let failed = 0;

  await new Promise((resolve, reject) => {
    let alive = workerCount;
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(SELF, { workerData: { quality: QUALITY } });
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
        if (msg.ok) bytes += msg.bytes;
        else {
          failed++;
          console.error('FAIL', msg.out, msg.err);
        }
        if (done % 60 === 0 || done === total) {
          const s = ((Date.now() - started) / 1000).toFixed(1);
          console.log(`[${done}/${total}] ${s}s  ${(bytes / 1048576).toFixed(1)} MB`);
        }
        next();
      });
      worker.on('error', reject);
      next();
    }
  });

  console.log(
    `done in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
      `${(bytes / 1048576).toFixed(1)} MB written, ${failed} failed`
  );
}
