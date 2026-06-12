import { defineSim } from 'automatick/sim';
import type { SimRandom } from 'automatick/random';

export const SAND_W = 200;
export const SAND_H = 200;

export const EMPTY = 0;
export const SAND = 1;
export const WATER = 2;
export const STONE = 3;

export type FallingSandData = {
  grid: Uint8Array;
  /** Last known brush position; while `down`, the brush keeps painting every tick. */
  pen: { x: number; y: number; down: boolean };
};

export type FallingSandParams = {
  material: number;
  brushSize: number;
  dropRate: number;
};

/** Transient brush events: strokes paint at a grid cell, lift ends the stroke. */
export type FallingSandInput =
  | { kind: 'paint'; x: number; y: number }
  | { kind: 'lift' };

const idx = (x: number, y: number) => y * SAND_W + x;

function inBounds(x: number, y: number) {
  return x >= 0 && x < SAND_W && y >= 0 && y < SAND_H;
}

function canSandDisplace(cell: number) {
  return cell === EMPTY || cell === WATER;
}

function updateSand(next: Uint8Array, x: number, y: number, random: SimRandom) {
  if (next[idx(x, y)] !== SAND) return;
  const below = y + 1;
  if (below >= SAND_H) return;

  const belowCell = next[idx(x, below)];
  if (canSandDisplace(belowCell)) {
    next[idx(x, below)] = SAND;
    next[idx(x, y)] = belowCell;
    return;
  }

  const dir = random() < 0.5 ? -1 : 1;
  const dx1 = x + dir;
  const dx2 = x - dir;

  if (inBounds(dx1, below) && canSandDisplace(next[idx(dx1, below)])) {
    const displaced = next[idx(dx1, below)];
    next[idx(dx1, below)] = SAND;
    next[idx(x, y)] = displaced;
  } else if (inBounds(dx2, below) && canSandDisplace(next[idx(dx2, below)])) {
    const displaced = next[idx(dx2, below)];
    next[idx(dx2, below)] = SAND;
    next[idx(x, y)] = displaced;
  }
}

function updateWater(next: Uint8Array, x: number, y: number, random: SimRandom) {
  if (next[idx(x, y)] !== WATER) return;
  const below = y + 1;

  if (below < SAND_H && next[idx(x, below)] === EMPTY) {
    next[idx(x, below)] = WATER;
    next[idx(x, y)] = EMPTY;
    return;
  }

  const dir = random() < 0.5 ? -1 : 1;
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
      if (!inBounds(px, py)) continue;
      if (material === EMPTY || grid[idx(px, py)] === EMPTY) {
        grid[idx(px, py)] = material;
      }
    }
  }
}

export default defineSim<FallingSandData, FallingSandParams, FallingSandInput>({
  defaultParams: {
    material: SAND,
    brushSize: 3,
    dropRate: 5,
  },

  init: () => ({
    grid: new Uint8Array(SAND_W * SAND_H),
    pen: { x: 0, y: 0, down: false },
  }),

  step: ({ data, params, inputs, random }) => {
    const { grid } = data;
    const next = new Uint8Array(grid);
    const pen = { ...data.pen };

    // Apply every queued stroke (none are coalesced), then keep painting at
    // the last position while the pointer stays down — a held brush pours.
    let painted = false;
    for (const input of inputs) {
      if (input.kind === 'lift') {
        pen.down = false;
        continue;
      }
      pen.x = input.x;
      pen.y = input.y;
      pen.down = true;
      paintBrush(next, input.x, input.y, params.brushSize, params.material);
      painted = true;
    }
    if (pen.down && !painted) {
      paintBrush(next, pen.x, pen.y, params.brushSize, params.material);
    }

    const order = new Array(SAND_W);
    for (let i = 0; i < SAND_W; i++) order[i] = i;
    for (let i = SAND_W - 1; i > 0; i--) {
      const j = random.int(0, i);
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }

    for (let y = SAND_H - 2; y >= 0; y--) {
      for (let xi = 0; xi < SAND_W; xi++) {
        const x = order[xi];
        const cell = next[idx(x, y)];
        if (cell === SAND) updateSand(next, x, y, random);
        else if (cell === WATER) updateWater(next, x, y, random);
      }
    }

    if (params.material !== STONE) {
      for (let i = 0; i < params.dropRate; i++) {
        const x = random.int(0, SAND_W - 1);
        if (next[idx(x, 0)] === EMPTY) {
          next[idx(x, 0)] = params.material;
        }
      }
    }

    return { grid: next, pen };
  },
});
