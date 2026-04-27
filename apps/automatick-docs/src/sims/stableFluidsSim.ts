import { defineSim } from 'automatick/sim';

const N = 128;
const SIZE = (N + 2) * (N + 2);
const ITERATIONS = 20;

const IX = (i: number, j: number): number => i + j * (N + 2);

export type StableFluidsData = {
  u: Float32Array;
  v: Float32Array;
  uPrev: Float32Array;
  vPrev: Float32Array;
  densR: Float32Array;
  densRPrev: Float32Array;
  densG: Float32Array;
  densGPrev: Float32Array;
  densB: Float32Array;
  densBPrev: Float32Array;
};

export type StableFluidsParams = {
  visc: number;
  diff: number;
  dt: number;
  forceStrength: number;
  dissipation: number;
  radiusR: number;
  radiusG: number;
  radiusB: number;
  speedR: number;
  speedG: number;
  speedB: number;
};

const setBnd = (b: number, x: Float32Array): void => {
  for (let i = 1; i <= N; i++) {
    x[IX(0, i)] = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
    x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)] : x[IX(N, i)];
    x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
    x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
  }
  x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
  x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
  x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
  x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
};

const addSource = (x: Float32Array, s: Float32Array, dt: number): void => {
  for (let i = 0; i < SIZE; i++) x[i] += dt * s[i];
};

const diffuse = (
  b: number,
  x: Float32Array,
  x0: Float32Array,
  diff: number,
  dt: number
): void => {
  const a = dt * diff * N * N;
  const denom = 1 + 4 * a;
  for (let k = 0; k < ITERATIONS; k++) {
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        const idx = IX(i, j);
        x[idx] =
          (x0[idx] +
            a *
              (x[IX(i - 1, j)] +
                x[IX(i + 1, j)] +
                x[IX(i, j - 1)] +
                x[IX(i, j + 1)])) /
          denom;
      }
    }
    setBnd(b, x);
  }
};

const advect = (
  b: number,
  d: Float32Array,
  d0: Float32Array,
  u: Float32Array,
  v: Float32Array,
  dt: number
): void => {
  const dt0 = dt * N;
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      let x = i - dt0 * u[IX(i, j)];
      let y = j - dt0 * v[IX(i, j)];
      if (x < 0.5) x = 0.5;
      if (x > N + 0.5) x = N + 0.5;
      const i0 = Math.floor(x);
      const i1 = i0 + 1;
      if (y < 0.5) y = 0.5;
      if (y > N + 0.5) y = N + 0.5;
      const j0 = Math.floor(y);
      const j1 = j0 + 1;
      const s1 = x - i0;
      const s0 = 1 - s1;
      const t1 = y - j0;
      const t0 = 1 - t1;
      d[IX(i, j)] =
        s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
        s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
    }
  }
  setBnd(b, d);
};

const project = (
  u: Float32Array,
  v: Float32Array,
  p: Float32Array,
  div: Float32Array
): void => {
  const h = 1 / N;
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      div[IX(i, j)] =
        -0.5 *
        h *
        (u[IX(i + 1, j)] - u[IX(i - 1, j)] + v[IX(i, j + 1)] - v[IX(i, j - 1)]);
      p[IX(i, j)] = 0;
    }
  }
  setBnd(0, div);
  setBnd(0, p);
  for (let k = 0; k < ITERATIONS; k++) {
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        p[IX(i, j)] =
          (div[IX(i, j)] +
            p[IX(i - 1, j)] +
            p[IX(i + 1, j)] +
            p[IX(i, j - 1)] +
            p[IX(i, j + 1)]) /
          4;
      }
    }
    setBnd(0, p);
  }
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      u[IX(i, j)] -= (0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)])) / h;
      v[IX(i, j)] -= (0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)])) / h;
    }
  }
  setBnd(1, u);
  setBnd(2, v);
};

const velStep = (
  u: Float32Array,
  v: Float32Array,
  u0: Float32Array,
  v0: Float32Array,
  visc: number,
  dt: number
): { u: Float32Array; v: Float32Array; u0: Float32Array; v0: Float32Array } => {
  addSource(u, u0, dt);
  addSource(v, v0, dt);
  // swap u0 <-> u, then diffuse into u from u0
  let tmp = u0;
  u0 = u;
  u = tmp;
  diffuse(1, u, u0, visc, dt);
  tmp = v0;
  v0 = v;
  v = tmp;
  diffuse(2, v, v0, visc, dt);
  project(u, v, u0, v0);
  tmp = u0;
  u0 = u;
  u = tmp;
  tmp = v0;
  v0 = v;
  v = tmp;
  advect(1, u, u0, u0, v0, dt);
  advect(2, v, v0, u0, v0, dt);
  project(u, v, u0, v0);
  return { u, v, u0, v0 };
};

const densStep = (
  d: Float32Array,
  d0: Float32Array,
  u: Float32Array,
  v: Float32Array,
  diff: number,
  dt: number,
  dissipation: number
): { d: Float32Array; d0: Float32Array } => {
  addSource(d, d0, dt);
  let tmp = d0;
  d0 = d;
  d = tmp;
  diffuse(0, d, d0, diff, dt);
  tmp = d0;
  d0 = d;
  d = tmp;
  advect(0, d, d0, u, v, dt);
  const decay = 1 / (1 + dt * dissipation);
  for (let i = 0; i < SIZE; i++) d[i] *= decay;
  return { d, d0 };
};

export default defineSim<StableFluidsData, StableFluidsParams>({
  defaultParams: {
    visc: 0.00001,
    diff: 0.00001,
    dt: 0.1,
    forceStrength: 40,
    dissipation: 0.1,
    radiusR: 30,
    radiusG: 45,
    radiusB: 20,
    speedR: 0.04,
    speedG: -0.035,
    speedB: 0.07
  },

  init: () => ({
    u: new Float32Array(SIZE),
    v: new Float32Array(SIZE),
    uPrev: new Float32Array(SIZE),
    vPrev: new Float32Array(SIZE),
    densR: new Float32Array(SIZE),
    densRPrev: new Float32Array(SIZE),
    densG: new Float32Array(SIZE),
    densGPrev: new Float32Array(SIZE),
    densB: new Float32Array(SIZE),
    densBPrev: new Float32Array(SIZE)
  }),

  step: ({ data, params, tick }) => {
    const {
      visc,
      diff,
      dt,
      forceStrength,
      dissipation,
      radiusR,
      radiusG,
      radiusB,
      speedR,
      speedG,
      speedB
    } = params;
    let { u, v, uPrev, vPrev } = data;
    let { densR, densRPrev, densG, densGPrev, densB, densBPrev } = data;

    uPrev.fill(0);
    vPrev.fill(0);
    densRPrev.fill(0);
    densGPrev.fill(0);
    densBPrev.fill(0);

    // Three emitters on independent orbits, one per channel, each adding
    // a tangential velocity impulse so plumes curl and mix.
    const emitters: {
      phase: number;
      radius: number;
      src: Float32Array;
    }[] = [
      { phase: tick * speedR, radius: radiusR, src: densRPrev },
      {
        phase: tick * speedG + (Math.PI * 2) / 3,
        radius: radiusG,
        src: densGPrev
      },
      {
        phase: tick * speedB + (Math.PI * 4) / 3,
        radius: radiusB,
        src: densBPrev
      }
    ];
    const BRUSH = 3;
    for (const e of emitters) {
      const cx = N / 2 + Math.cos(e.phase) * e.radius;
      const cy = N / 2 + Math.sin(e.phase) * e.radius;
      const ci = Math.floor(cx);
      const cj = Math.floor(cy);
      const ut = -Math.sin(e.phase) * forceStrength;
      const vt = Math.cos(e.phase) * forceStrength;
      for (let dj = -BRUSH; dj <= BRUSH; dj++) {
        for (let di = -BRUSH; di <= BRUSH; di++) {
          const i = ci + di;
          const j = cj + dj;
          if (i < 1 || i > N || j < 1 || j > N) continue;
          const r2 = di * di + dj * dj;
          if (r2 > BRUSH * BRUSH) continue;
          const w = Math.exp(-r2 * 0.25);
          const idx = IX(i, j);
          e.src[idx] += forceStrength * 12 * w;
          uPrev[idx] += ut * w;
          vPrev[idx] += vt * w;
        }
      }
    }

    const velResult = velStep(u, v, uPrev, vPrev, visc, dt);
    u = velResult.u;
    v = velResult.v;
    uPrev = velResult.u0;
    vPrev = velResult.v0;

    const r = densStep(densR, densRPrev, u, v, diff, dt, dissipation);
    densR = r.d;
    densRPrev = r.d0;
    const g = densStep(densG, densGPrev, u, v, diff, dt, dissipation);
    densG = g.d;
    densGPrev = g.d0;
    const b = densStep(densB, densBPrev, u, v, diff, dt, dissipation);
    densB = b.d;
    densBPrev = b.d0;

    return {
      u,
      v,
      uPrev,
      vPrev,
      densR,
      densRPrev,
      densG,
      densGPrev,
      densB,
      densBPrev
    };
  }
});

export const GRID_N = N;
