/**
 * engine.mjs - a small CPU raymarcher used to author the site's frame sequences.
 * Monochromatic, chiaroscuro lighting, filmic tone mapping. No runtime deps.
 */

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const mix = (a, b, t) => a + (b - a) * t;
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

/* ------------------------------------------------------------------ *
 * Scene A - "OBSIDIAN": a twisted ribbon orbiting a floating core.
 * ------------------------------------------------------------------ */

function sdfRibbon(x, y, z, spin) {
  const a = Math.atan2(z, x);
  const r = Math.sqrt(x * x + z * z) - 1.02;
  const ang = a * 1.5 + spin;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const u = r * c - y * s;
  const v = r * s + y * c;
  const bx = Math.abs(u) - 0.44;
  const by = Math.abs(v) - 0.05;
  const ox = bx > 0 ? bx : 0;
  const oy = by > 0 ? by : 0;
  const outside = Math.sqrt(ox * ox + oy * oy);
  const inside = Math.min(Math.max(bx, by), 0);
  return outside + inside - 0.028;
}

// Distance for scene A; the material id is written to MAT[0]: 0 = form, 1 = floor.
const MAT = new Int8Array(1);

function sceneA(x, y, z, p) {
  const cs = Math.cos(p.tilt);
  const sn = Math.sin(p.tilt);
  // Tilt the whole form around Z so the ribbon reads as a leaning ellipse.
  const rx = x * cs - y * sn;
  const ry = x * sn + y * cs;
  let d = sdfRibbon(rx, ry, z, p.spin);
  const core = Math.sqrt(x * x + y * y + z * z) - p.core;
  if (core < d) d = core;
  let m = 0;
  const floor = y + 1.22;
  if (floor < d) {
    d = floor;
    m = 1;
  }
  MAT[0] = m;
  return d;
}

/* ------------------------------------------------------------------ *
 * Scene B - "DRAPE": a satin height field, camera gliding low across it.
 * ------------------------------------------------------------------ */

function heightB(x, z, t) {
  return (
    0.34 * Math.sin(x * 0.72 + t * 1.15) * Math.cos(z * 0.55 - t * 0.72) +
    0.17 * Math.sin(x * 1.63 - z * 1.31 + t * 1.8) +
    0.075 * Math.sin(x * 3.4 + z * 2.6 - t * 2.4) +
    0.03 * Math.sin(x * 7.1 - z * 5.9 + t * 1.1)
  );
}

/* ------------------------------------------------------------------ *
 * Shading
 * ------------------------------------------------------------------ */

const aces = (x) => {
  const a = 2.51;
  const b = 0.03;
  const c = 2.43;
  const d = 0.59;
  const e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1);
};

function normalize3(v) {
  const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  v[0] /= l;
  v[1] /= l;
  v[2] /= l;
  return v;
}

const KEY = normalize3([-0.55, 0.72, 0.42]);
const RIM = normalize3([0.82, 0.16, -0.62]);

function cameraRay(px, py, w, h, p) {
  const aspect = w / h;
  const sx = aspect >= 1 ? aspect : 1;
  const sy = aspect >= 1 ? 1 : 1 / aspect;
  const uvx = ((px + 0.5) / w) * 2 - 1;
  const uvy = 1 - ((py + 0.5) / h) * 2;

  const ro = p.ro;
  const ta = p.ta;
  const fw = normalize3([ta[0] - ro[0], ta[1] - ro[1], ta[2] - ro[2]]);
  const rt = normalize3([-fw[2], 0, fw[0]]);
  const up = [
    rt[1] * fw[2] - rt[2] * fw[1],
    rt[2] * fw[0] - rt[0] * fw[2],
    rt[0] * fw[1] - rt[1] * fw[0],
  ];
  const rd = normalize3([
    fw[0] * p.fov + rt[0] * uvx * sx + up[0] * uvy * sy,
    fw[1] * p.fov + rt[1] * uvx * sx + up[1] * uvy * sy,
    fw[2] * p.fov + rt[2] * uvx * sx + up[2] * uvy * sy,
  ]);
  return { rd, vx: uvx * sx, vy: uvy * sy };
}

function grade(col, p, vx, vy, vignette, contrast) {
  const ex = p.exposure;
  let r = aces(col[0] * ex);
  let g = aces(col[1] * ex);
  let b = aces(col[2] * ex);
  r = Math.pow(r, 1 / 2.2);
  g = Math.pow(g, 1 / 2.2);
  b = Math.pow(b, 1 / 2.2);
  const vig = mix(1, vignette, clamp((vx * vx + vy * vy) * 0.44, 0, 1));
  r *= vig;
  g *= vig;
  b *= vig;
  r = clamp((r - 0.5) * contrast + 0.5 + 0.008, 0, 1);
  g = clamp((g - 0.5) * contrast + 0.5 + 0.008, 0, 1);
  b = clamp((b - 0.5) * contrast + 0.5 + 0.008, 0, 1);
  return [r, g, b];
}

function backgroundA(rd, p) {
  const v = smoothstep(-0.55, 0.75, rd[1]);
  const l = mix(0.012, 0.052, v);
  const dl = Math.max(0, rd[0] * KEY[0] + rd[1] * KEY[1] + rd[2] * KEY[2]);
  const lum = l + 0.1 * Math.pow(dl, 7) * p.glow;
  return [lum, lum * 0.99, lum * 0.98];
}

function renderA(px, py, w, h, p) {
  const { rd, vx, vy } = cameraRay(px, py, w, h, p);
  const ro = p.ro;

  let t = 0.05;
  let hit = -1;
  let mat = 0;
  for (let i = 0; i < 150; i++) {
    const d = sceneA(ro[0] + rd[0] * t, ro[1] + rd[1] * t, ro[2] + rd[2] * t, p);
    if (d < 0.0009 * t) {
      hit = t;
      mat = MAT[0];
      break;
    }
    t += d * 0.92;
    if (t > 26) break;
  }

  let col;
  if (hit < 0) {
    col = backgroundA(rd, p);
  } else {
    const x = ro[0] + rd[0] * hit;
    const y = ro[1] + rd[1] * hit;
    const z = ro[2] + rd[2] * hit;
    const e = 0.0012 * (1 + hit);
    const n = normalize3([
      sceneA(x + e, y, z, p) - sceneA(x - e, y, z, p),
      sceneA(x, y + e, z, p) - sceneA(x, y - e, z, p),
      sceneA(x, y, z + e, p) - sceneA(x, y, z - e, p),
    ]);

    let occ = 0;
    let sca = 1;
    for (let i = 1; i <= 5; i++) {
      const hh = 0.015 + 0.11 * i;
      const dd = sceneA(x + n[0] * hh, y + n[1] * hh, z + n[2] * hh, p);
      occ += (hh - dd) * sca;
      sca *= 0.7;
    }
    const ao = clamp(1 - 1.45 * occ, 0, 1);

    let sh = 1;
    let st = 0.03;
    for (let i = 0; i < 40; i++) {
      const dd = sceneA(x + KEY[0] * st, y + KEY[1] * st, z + KEY[2] * st, p);
      const s = (9 * dd) / st;
      if (s < sh) sh = s;
      st += clamp(dd, 0.025, 0.5);
      if (sh < 0.004 || st > 7) break;
    }
    sh = clamp(sh, 0, 1);

    const ndl = Math.max(0, n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2]);
    const ndr = Math.max(0, n[0] * RIM[0] + n[1] * RIM[1] + n[2] * RIM[2]);
    const fres = Math.pow(
      clamp(1 + (rd[0] * n[0] + rd[1] * n[1] + rd[2] * n[2]), 0, 1),
      4
    );
    const hv = normalize3([KEY[0] - rd[0], KEY[1] - rd[1], KEY[2] - rd[2]]);
    const ndh = Math.max(0, n[0] * hv[0] + n[1] * hv[1] + n[2] * hv[2]);

    if (mat === 1) {
      const dist = Math.sqrt(x * x + z * z);
      const base = 0.052 * mix(1, 0.25, smoothstep(2.0, 11.0, dist));
      let lum = base * (0.28 + 0.72 * ndl * sh) * ao;
      lum += 0.045 * Math.pow(ndh, 26) * sh;
      lum += 0.03 * ndr;
      const bg = backgroundA(rd, p);
      const fog = smoothstep(4.5, 17.0, hit);
      col = [
        mix(lum, bg[0], fog),
        mix(lum * 0.985, bg[1], fog),
        mix(lum * 0.96, bg[2], fog),
      ];
    } else {
      let lum = 0.085 * (0.16 + 0.84 * ndl * mix(0.35, 1, sh)) * ao;
      lum += 0.62 * Math.pow(ndh, 62) * sh;
      lum += 0.035 * Math.pow(ndh, 12) * sh;
      lum += 0.3 * ndr * ao;
      lum += 0.2 * fres * ao;
      lum += 0.02 * ao;
      col = [lum, lum * 0.978, lum * 0.945];
    }
  }

  return grade(col, p, vx, vy, 0.62, 1.1);
}

function renderB(px, py, w, h, p) {
  const { rd, vx, vy } = cameraRay(px, py, w, h, p);
  const ro = p.ro;
  const t0 = p.t;

  let t = 0.1;
  let tPrev = t;
  let hit = -1;
  for (let i = 0; i < 260; i++) {
    const d =
      ro[1] + rd[1] * t - heightB(ro[0] + rd[0] * t, ro[2] + rd[2] * t, t0);
    if (d < 0) {
      // Bisect the crossing so the silhouette stays free of stair-stepping.
      let lo = tPrev;
      let hi = t;
      for (let k = 0; k < 14; k++) {
        const m = 0.5 * (lo + hi);
        const dm =
          ro[1] + rd[1] * m - heightB(ro[0] + rd[0] * m, ro[2] + rd[2] * m, t0);
        if (dm > 0) lo = m;
        else hi = m;
      }
      hit = 0.5 * (lo + hi);
      break;
    }
    tPrev = t;
    t += Math.max(0.008, d * 0.35);
    if (t > 34) break;
  }

  let col;
  if (hit < 0) {
    const lum = mix(0.055, 0.016, smoothstep(-0.1, 0.5, rd[1]));
    col = [lum, lum * 0.99, lum * 0.975];
  } else {
    const x = ro[0] + rd[0] * hit;
    const z = ro[2] + rd[2] * hit;
    const e = 0.006;
    const n = normalize3([
      heightB(x - e, z, t0) - heightB(x + e, z, t0),
      2 * e,
      heightB(x, z - e, t0) - heightB(x, z + e, t0),
    ]);

    const ndl = Math.max(0, n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2]);
    const ndr = Math.max(0, n[0] * RIM[0] + n[1] * RIM[1] + n[2] * RIM[2]);
    const hv = normalize3([KEY[0] - rd[0], KEY[1] - rd[1], KEY[2] - rd[2]]);
    const ndh = Math.max(0, n[0] * hv[0] + n[1] * hv[1] + n[2] * hv[2]);
    const fres = Math.pow(
      clamp(1 + (rd[0] * n[0] + rd[1] * n[1] + rd[2] * n[2]), 0, 1),
      5
    );
    // Cheap self-occlusion driven by local slope - the troughs go dark.
    const ao = clamp(0.45 + 0.55 * n[1], 0, 1);

    let lum = 0.075 * (0.12 + 0.88 * ndl) * ao;
    lum += 0.85 * Math.pow(ndh, 46);
    lum += 0.1 * Math.pow(ndh, 8) * ao;
    lum += 0.16 * ndr * ao;
    lum += 0.13 * fres;

    const fog = smoothstep(4.5, 19, hit);
    col = [
      mix(lum, 0.032, fog),
      mix(lum * 0.982, 0.0317, fog),
      mix(lum * 0.955, 0.031, fog),
    ];
  }

  return grade(col, p, vx, vy, 0.55, 1.14);
}

/* ------------------------------------------------------------------ *
 * Camera choreography - u runs 0 -> 1 across the sequence
 * ------------------------------------------------------------------ */

const ease = (t) => t * t * (3 - 2 * t);

export function paramsA(u) {
  const e = ease(u);
  const radius = mix(3.95, 2.15, e);
  const theta = mix(-0.62, 0.44, u);
  const height = mix(1.35, 0.22, ease(clamp(u * 1.08, 0, 1)));
  return {
    ro: [Math.sin(theta) * radius, height, Math.cos(theta) * radius],
    ta: [0, mix(0.12, -0.02, e), 0],
    fov: mix(1.28, 1.05, e),
    spin: mix(0, 1.05, u),
    tilt: mix(0.16, 0.34, e),
    core: mix(0.3, 0.365, ease(Math.sin(u * Math.PI))),
    glow: mix(0.6, 1.25, u),
    exposure: mix(1.02, 1.16, u),
  };
}

export function paramsB(u) {
  const e = ease(u);
  return {
    ro: [mix(-2.3, 2.1, u), mix(1.42, 0.72, e), mix(5.4, -1.4, u)],
    ta: [mix(0.4, -0.3, u), mix(0.05, -0.12, e), mix(0.6, -5.2, u)],
    fov: mix(1.35, 1.02, e),
    t: mix(0, 3.4, u),
    exposure: mix(1.05, 1.2, e),
  };
}

export const RENDERERS = { A: renderA, B: renderB };
export const PARAMS = { A: paramsA, B: paramsB };
