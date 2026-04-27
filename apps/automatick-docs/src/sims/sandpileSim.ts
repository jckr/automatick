import { defineSim } from 'automatick/sim';

export const SANDPILE_WIDTH = 201;
export const SANDPILE_HEIGHT = 201;

export type SandpileData = {
  grid: Uint32Array;
  toppleCount: number;
};

export type SandpileParams = {
  grainsPerTick: number;
};

export default defineSim<SandpileData, SandpileParams>({
  defaultParams: {
    grainsPerTick: 20,
  },

  init: () => {
    return {
      grid: new Uint32Array(SANDPILE_WIDTH * SANDPILE_HEIGHT),
      toppleCount: 0,
    };
  },

  step: ({ data, params }) => {
    const W = SANDPILE_WIDTH;
    const H = SANDPILE_HEIGHT;
    const grid = new Uint32Array(data.grid);

    const cx = W >> 1;
    const cy = H >> 1;
    const centerIdx = cy * W + cx;
    grid[centerIdx] += params.grainsPerTick;

    const queue: number[] = [centerIdx];
    let toppleCount = 0;

    while (queue.length > 0) {
      const idx = queue.pop();
      if (idx === undefined) break;
      if (grid[idx] < 4) continue;

      const x = idx % W;
      const y = (idx - x) / W;

      grid[idx] -= 4;
      toppleCount++;

      if (y > 0) {
        const n = idx - W;
        grid[n] += 1;
        if (grid[n] >= 4) queue.push(n);
      }
      if (y < H - 1) {
        const s = idx + W;
        grid[s] += 1;
        if (grid[s] >= 4) queue.push(s);
      }
      if (x > 0) {
        const w = idx - 1;
        grid[w] += 1;
        if (grid[w] >= 4) queue.push(w);
      }
      if (x < W - 1) {
        const e = idx + 1;
        grid[e] += 1;
        if (grid[e] >= 4) queue.push(e);
      }

      if (grid[idx] >= 4) queue.push(idx);
    }

    return { grid, toppleCount };
  },
});
