import { defineSim } from 'automatick/sim';

const W = 240;
const H = 240;

export type PhysarumData = {
  // Agent state stored as parallel typed arrays for structured-clone safety + speed.
  ax: Float32Array;
  ay: Float32Array;
  angle: Float32Array;
  trail: Float32Array;
  width: number;
  height: number;
};

export type PhysarumParams = {
  numAgents: number;
  sensorAngle: number;
  sensorDistance: number;
  turnSpeed: number;
  moveSpeed: number;
  depositAmount: number;
  decayRate: number;
  width: number;
  height: number;
};

function makeAgents(n: number, random: () => number) {
  const ax = new Float32Array(n);
  const ay = new Float32Array(n);
  const angle = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    ax[i] = random() * W;
    ay[i] = random() * H;
    angle[i] = random() * Math.PI * 2;
  }
  return { ax, ay, angle };
}

function wrap(v: number, max: number): number {
  if (v < 0) return v + max;
  if (v >= max) return v - max;
  return v;
}

function sample(trail: Float32Array, x: number, y: number): number {
  const ix = ((Math.floor(x) % W) + W) % W;
  const iy = ((Math.floor(y) % H) + H) % H;
  return trail[iy * W + ix];
}

export default defineSim<PhysarumData, PhysarumParams>({
  defaultParams: {
    numAgents: 5000,
    sensorAngle: 0.5,
    sensorDistance: 9,
    turnSpeed: 0.4,
    moveSpeed: 1.0,
    depositAmount: 2.5,
    decayRate: 0.9,
    width: W,
    height: H,
  },

  init: (params, { random }) => {
    const { ax, ay, angle } = makeAgents(params.numAgents, random);
    const trail = new Float32Array(W * H);
    return { ax, ay, angle, trail, width: W, height: H };
  },

  step: ({ data, params, random }) => {
    const {
      numAgents,
      sensorAngle,
      sensorDistance,
      turnSpeed,
      moveSpeed,
      depositAmount,
      decayRate,
    } = params;

    let { ax, ay, angle } = data;
    const trail = data.trail;

    // Re-seed agent arrays if the requested count changed at runtime.
    if (ax.length !== numAgents) {
      const fresh = makeAgents(numAgents, random);
      ax = fresh.ax;
      ay = fresh.ay;
      angle = fresh.angle;
    }

    // --- Phase 1: agent sense, turn, move, deposit ---
    for (let i = 0; i < ax.length; i++) {
      const a = angle[i];
      const x = ax[i];
      const y = ay[i];

      const fx = x + Math.cos(a) * sensorDistance;
      const fy = y + Math.sin(a) * sensorDistance;
      const lx = x + Math.cos(a - sensorAngle) * sensorDistance;
      const ly = y + Math.sin(a - sensorAngle) * sensorDistance;
      const rx = x + Math.cos(a + sensorAngle) * sensorDistance;
      const ry = y + Math.sin(a + sensorAngle) * sensorDistance;

      const fwd = sample(trail, fx, fy);
      const left = sample(trail, lx, ly);
      const right = sample(trail, rx, ry);

      let na = a;
      if (fwd > left && fwd > right) {
        // keep heading
      } else if (left > right) {
        na = a - turnSpeed;
      } else if (right > left) {
        na = a + turnSpeed;
      } else {
        // ambiguous: small random jitter
        na = a + (random() - 0.5) * turnSpeed * 2;
      }
      angle[i] = na;

      const nx = wrap(x + Math.cos(na) * moveSpeed, W);
      const ny = wrap(y + Math.sin(na) * moveSpeed, H);
      ax[i] = nx;
      ay[i] = ny;

      const ti = (Math.floor(ny) % H) * W + (Math.floor(nx) % W);
      trail[ti] += depositAmount;
    }

    // --- Phase 2: diffuse (3x3 box blur) + decay ---
    const next = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      const yN = y === 0 ? H - 1 : y - 1;
      const yS = y === H - 1 ? 0 : y + 1;
      for (let x = 0; x < W; x++) {
        const xW = x === 0 ? W - 1 : x - 1;
        const xE = x === W - 1 ? 0 : x + 1;
        const sum =
          trail[yN * W + xW] +
          trail[yN * W + x] +
          trail[yN * W + xE] +
          trail[y * W + xW] +
          trail[y * W + x] +
          trail[y * W + xE] +
          trail[yS * W + xW] +
          trail[yS * W + x] +
          trail[yS * W + xE];
        next[y * W + x] = (sum / 9) * decayRate;
      }
    }

    return { ax, ay, angle, trail: next, width: W, height: H };
  },
});
