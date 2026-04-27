import { defineSim } from 'automatick/sim';

export type SphFluidData = {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  rho: Float32Array;
  pressure: Float32Array;
  count: number;
};

export type SphFluidParams = {
  count: number;
  gasK: number;
  mu: number;
  gravityY: number;
};

const WIDTH = 600;
const HEIGHT = 400;
const H = 16;
const H2 = H * H;
const MASS = 1;
const REST_DENSITY = 300;
const DT = 0.0007;
const BOUNCE = 0.5;

const POLY6 = 4 / (Math.PI * Math.pow(H, 8));
const SPIKY_GRAD = -10 / (Math.PI * Math.pow(H, 5));
const VISC_LAP = 40 / (Math.PI * Math.pow(H, 5));

const GRID_W = Math.ceil(WIDTH / H);
const GRID_H = Math.ceil(HEIGHT / H);

export default defineSim<SphFluidData, SphFluidParams>({
  defaultParams: {
    count: 1500,
    gasK: 2000,
    mu: 250,
    gravityY: 2000,
  },

  init: ({ count }) => {
    const x = new Float32Array(count);
    const y = new Float32Array(count);
    const vx = new Float32Array(count);
    const vy = new Float32Array(count);
    const rho = new Float32Array(count);
    const pressure = new Float32Array(count);

    // Dam-break: fill a rectangle in the top-left (20% wide x 50% tall).
    const spacing = H * 0.55;
    const regionW = WIDTH * 0.2;
    const regionH = HEIGHT * 0.5;
    const cols = Math.max(1, Math.floor(regionW / spacing));

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jitter = (Math.random() - 0.5) * spacing * 0.1;
      x[i] = spacing + col * spacing + jitter;
      y[i] = spacing + row * spacing + jitter;
      if (y[i] > regionH) y[i] = regionH - Math.random() * spacing;
    }

    return { x, y, vx, vy, rho, pressure, count };
  },

  step: ({ data, params }) => {
    const { gasK, mu, gravityY } = params;
    const n = data.count;

    const x = new Float32Array(data.x);
    const y = new Float32Array(data.y);
    const vx = new Float32Array(data.vx);
    const vy = new Float32Array(data.vy);
    const rho = new Float32Array(n);
    const pressure = new Float32Array(n);

    const cells: number[][] = Array.from({ length: GRID_W * GRID_H }, () => []);
    for (let i = 0; i < n; i++) {
      const cx = Math.min(GRID_W - 1, Math.max(0, Math.floor(x[i] / H)));
      const cy = Math.min(GRID_H - 1, Math.max(0, Math.floor(y[i] / H)));
      cells[cx + cy * GRID_W].push(i);
    }

    for (let i = 0; i < n; i++) {
      const cx = Math.min(GRID_W - 1, Math.max(0, Math.floor(x[i] / H)));
      const cy = Math.min(GRID_H - 1, Math.max(0, Math.floor(y[i] / H)));
      let density = 0;
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        if (gy < 0 || gy >= GRID_H) continue;
        for (let gx = cx - 1; gx <= cx + 1; gx++) {
          if (gx < 0 || gx >= GRID_W) continue;
          const bucket = cells[gx + gy * GRID_W];
          for (let k = 0; k < bucket.length; k++) {
            const j = bucket[k];
            const dx = x[j] - x[i];
            const dy = y[j] - y[i];
            const r2 = dx * dx + dy * dy;
            if (r2 < H2) {
              const diff = H2 - r2;
              density += MASS * POLY6 * diff * diff * diff;
            }
          }
        }
      }
      rho[i] = density;
      pressure[i] = gasK * (density - REST_DENSITY);
    }

    for (let i = 0; i < n; i++) {
      const cx = Math.min(GRID_W - 1, Math.max(0, Math.floor(x[i] / H)));
      const cy = Math.min(GRID_H - 1, Math.max(0, Math.floor(y[i] / H)));
      let fpx = 0;
      let fpy = 0;
      let fvx = 0;
      let fvy = 0;
      const pi = pressure[i];
      const vix = vx[i];
      const viy = vy[i];

      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        if (gy < 0 || gy >= GRID_H) continue;
        for (let gx = cx - 1; gx <= cx + 1; gx++) {
          if (gx < 0 || gx >= GRID_W) continue;
          const bucket = cells[gx + gy * GRID_W];
          for (let k = 0; k < bucket.length; k++) {
            const j = bucket[k];
            if (j === i) continue;
            const dx = x[j] - x[i];
            const dy = y[j] - y[i];
            const r2 = dx * dx + dy * dy;
            if (r2 < H2 && r2 > 1e-12) {
              const r = Math.sqrt(r2);
              if (r < 1e-6) continue;
              const rhoJ = rho[j] > 1e-6 ? rho[j] : 1e-6;
              const hr = H - r;

              const pTerm = (-MASS * (pi + pressure[j])) / (2 * rhoJ);
              const spiky = SPIKY_GRAD * hr * hr;
              fpx += pTerm * spiky * (dx / r);
              fpy += pTerm * spiky * (dy / r);

              const visc = (mu * MASS * VISC_LAP * hr) / rhoJ;
              fvx += visc * (vx[j] - vix);
              fvy += visc * (vy[j] - viy);
            }
          }
        }
      }

      const fgx = 0;
      const fgy = gravityY * MASS;
      const rhoI = rho[i] > 1e-6 ? rho[i] : 1e-6;

      vx[i] = vix + (DT * (fpx + fvx + fgx)) / rhoI;
      vy[i] = viy + (DT * (fpy + fvy + fgy)) / rhoI;
      x[i] += DT * vx[i];
      y[i] += DT * vy[i];

      if (x[i] < 0) {
        x[i] = 0;
        vx[i] = -vx[i] * BOUNCE;
      } else if (x[i] > WIDTH) {
        x[i] = WIDTH;
        vx[i] = -vx[i] * BOUNCE;
      }
      if (y[i] < 0) {
        y[i] = 0;
        vy[i] = -vy[i] * BOUNCE;
      } else if (y[i] > HEIGHT) {
        y[i] = HEIGHT;
        vy[i] = -vy[i] * BOUNCE;
      }
    }

    return { x, y, vx, vy, rho, pressure, count: n };
  },
});
