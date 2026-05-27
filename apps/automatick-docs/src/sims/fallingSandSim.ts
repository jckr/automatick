import { defineSim } from 'automatick/sim';

export const SAND_W = 200;
export const SAND_H = 200;

export const EMPTY = 0;
export const SAND = 1;
export const WATER = 2;
export const STONE = 3;

export type FallingSandData = {
  grid: Uint8Array;
};

export type FallingSandParams = {
  material: number;
  brushSize: number;
  dropRate: number;
  paintX: number;
  paintY: number;
};

const idx = (x: number, y: number) => y * SAND_W + x;

function inBounds(x: number, y: number) {
  return x >= 0 && x < SAND_W && y >= 0 && y < SAND_H;
}

function updateSand(grid: Uint8Array, next: Uint8Array, x: number, y: number) {
  if (next[idx(x, y)] !== SAND) return;
  const below = y + 1;
  if (below >= SAND_H) return;

  if (next[idx(x, below)] === EMPTY) {
    next[idx(x, below)] = SAND;
    next[idx(x, y)] = EMPTY;
    return;
  }

  const dir = Math.random() < 0.5 ? -1 : 1;
  const dx1 = x + dir;
  const dx2 = x - dir;

  if (inBounds(dx1, below) && next[idx(dx1, below)] === EMPTY) {
    next[idx(dx1, below)] = SAND;
    next[idx(x, y)] = EMPTY;
  } else if (inBounds(dx2, below) && next[idx(dx2, below)] === EMPTY) {
    next[idx(dx2, below)] = SAND;
    next[idx(x, y)] = EMPTY;
  }
}

function updateWater(grid: Uint8Array, next: Uint8Array, x: number, y: number) {
  if (next[idx(x, y)] !== WATER) return;
  const below = y + 1;

  if (below < SAND_H && next[idx(x, below)] === EMPTY) {
    next[idx(x, below)] = WATER;
    next[idx(x, y)] = EMPTY;
    return;
  }

  const dir = Math.random() < 0.5 ? -1 : 1;
  const dx1 = x + dir;
  const dx2 = x - dir;

  if (below < SAND_H) {
    if (inBounds(dx1, below) && next[idx(dx1, below)] === EMPTY) {
      next[idx(dx1, below)] = WATER;
      next[idx(x, y)] = EMPTY;
      return;
    }
    if (inBounds(dx2, below) && next[idx(dx2, below)] === EMPTY) {
      next[idx(dx2, below)] = WATER;
      next[idx(x, y)] = EMPTY;
      return;
    }
  }

  if (inBounds(dx1, y) && next[idx(dx1, y)] === EMPTY) {
    next[idx(dx1, y)] = WATER;
    next[idx(x, y)] = EMPTY;
  } else if (inBounds(dx2, y) && next[idx(dx2, y)] === EMPTY) {
    next[idx(dx2, y)] = WATER;
    next[idx(x, y)] = EMPTY;
  }
}

function paintBrush(
  grid: Uint8Array,
  cx: number,
  cy: number,
  radius: number,
  material: number,
) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const px = cx + dx;
      const py = cy + dy;
      if (inBounds(px, py) && grid[idx(px, py)] === EMPTY) {
        grid[idx(px, py)] = material;
      }
    }
  }
}

export default defineSim<FallingSandData, FallingSandParams>({
  defaultParams: {
    material: SAND,
    brushSize: 3,
    dropRate: 5,
    paintX: -1,
    paintY: -1,
  },

  init: () => ({
    grid: new Uint8Array(SAND_W * SAND_H),
  }),

  step: ({ data, params }) => {
    const { grid } = data;
    const next = new Uint8Array(grid);

    if (params.paintX >= 0 && params.paintY >= 0) {
      paintBrush(next, params.paintX, params.paintY, params.brushSize, params.material);
    }

    const order = new Array(SAND_W);
    for (let i = 0; i < SAND_W; i++) order[i] = i;
    for (let i = SAND_W - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }

    for (let y = SAND_H - 2; y >= 0; y--) {
      for (let xi = 0; xi < SAND_W; xi++) {
        const x = order[xi];
        const cell = next[idx(x, y)];
        if (cell === SAND) updateSand(grid, next, x, y);
        else if (cell === WATER) updateWater(grid, next, x, y);
      }
    }

    for (let i = 0; i < params.dropRate; i++) {
      const x = Math.floor(Math.random() * SAND_W);
      if (next[idx(x, 0)] === EMPTY) {
        next[idx(x, 0)] = params.material === STONE ? SAND : params.material;
      }
    }

    return { grid: next };
  },
});
