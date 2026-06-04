import { defineSim } from 'automatick/sim';

const W = 300;
const H = 300;

export type WaveData = {
  current: Float32Array;
  previous: Float32Array;
  width: number;
  height: number;
};

export type WaveParams = {
  width: number;
  height: number;
  damping: number;
  speed: number;
  sourceFrequency: number;
  sourceCount: number;
};

/** Evenly distribute up to `count` source points across the grid. */
function sourcePositions(count: number): Array<[number, number]> {
  const positions: Array<[number, number]> = [];
  if (count <= 1) {
    positions.push([Math.floor(W / 2), Math.floor(H / 2)]);
    return positions;
  }
  // Spread sources horizontally across the vertical center band.
  for (let i = 0; i < count; i++) {
    const x = Math.floor((W * (i + 1)) / (count + 1));
    const y = Math.floor(H / 2);
    positions.push([x, y]);
  }
  return positions;
}

export default defineSim<WaveData, WaveParams>({
  defaultParams: {
    width: W,
    height: H,
    damping: 0.995,
    speed: 0.2,
    sourceFrequency: 0.06,
    sourceCount: 2,
  },

  init: () => {
    const current = new Float32Array(W * H);
    const previous = new Float32Array(W * H);
    return { current, previous, width: W, height: H };
  },

  step: ({ data, params, tick }) => {
    const { damping, speed, sourceFrequency, sourceCount } = params;
    const cur = data.current;
    const prev = data.previous;
    const next = prev; // reuse the previous buffer for the next state

    // Discrete 2D wave equation with fixed (zero) boundaries.
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        const lap =
          cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W] - 4 * cur[i];
        let v = 2 * cur[i] - prev[i] + speed * lap;
        v *= damping;
        next[i] = v;
      }
    }

    // Zero the edges so boundaries stay fixed.
    for (let x = 0; x < W; x++) {
      next[x] = 0;
      next[(H - 1) * W + x] = 0;
    }
    for (let y = 0; y < H; y++) {
      next[y * W] = 0;
      next[y * W + W - 1] = 0;
    }

    // Inject oscillating sources.
    const amp = Math.sin(tick * sourceFrequency * 2 * Math.PI);
    const sources = sourcePositions(Math.max(1, Math.round(sourceCount)));
    for (const [sx, sy] of sources) {
      next[sy * W + sx] = amp;
    }

    // Buffers swap: next becomes current, old current becomes previous.
    return { current: next, previous: cur, width: W, height: H };
  },
});
