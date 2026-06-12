import { defineSim } from 'automatick/sim';

const W = 200;
const H = 200;

// Material types.
export const EMPTY = 0;
export const SAND = 1;
export const WATER = 2;
export const FIRE = 3;
export const SMOKE = 4;
export const WOOD = 5;

export type CellType = 0 | 1 | 2 | 3 | 4 | 5;

export type MaterialCAData = {
  grid: Uint8Array;
  energy: Float32Array;
  width: number;
  height: number;
  /** Last known brush position; while `down`, the brush keeps painting every tick. */
  pen: { x: number; y: number; down: boolean };
};

export type MaterialCAParams = {
  width: number;
  height: number;
  material: CellType;
  brushSize: number;
  fireSpreadChance: number;
  smokeFadeRate: number;
};

/** Transient brush events: strokes paint at a grid cell, lift ends the stroke. */
export type MaterialCAInput =
  | { kind: 'paint'; x: number; y: number }
  | { kind: 'lift' };

const FIRE_LIFETIME = 1.0;
const SMOKE_LIFETIME = 1.0;

function paintBrush(
  grid: Uint8Array,
  energy: Float32Array,
  cx: number,
  cy: number,
  radius: number,
  material: CellType,
) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const px = cx + dx;
      const py = cy + dy;
      if (px < 0 || px >= W || py < 0 || py >= H) continue;
      const i = py * W + px;
      grid[i] = material;
      energy[i] =
        material === FIRE
          ? FIRE_LIFETIME
          : material === SMOKE
            ? SMOKE_LIFETIME
            : 0;
    }
  }
}

export default defineSim<MaterialCAData, MaterialCAParams, MaterialCAInput>({
  defaultParams: {
    width: W,
    height: H,
    material: FIRE,
    brushSize: 4,
    fireSpreadChance: 0.3,
    smokeFadeRate: 0.04,
  },

  init: () => {
    const grid = new Uint8Array(W * H);
    const energy = new Float32Array(W * H);

    // Build a wooden platform in the center for fire to consume.
    const platW = 80;
    const platH = 24;
    const x0 = Math.floor((W - platW) / 2);
    const y0 = Math.floor(H * 0.55);
    for (let y = y0; y < y0 + platH; y++) {
      for (let x = x0; x < x0 + platW; x++) {
        grid[y * W + x] = WOOD;
      }
    }

    // A pool of water resting in a bowl below.
    const bowlY = Math.floor(H * 0.82);
    for (let y = bowlY; y < bowlY + 10; y++) {
      for (let x = 30; x < W - 30; x++) {
        grid[y * W + x] = WATER;
      }
    }

    // A small lit ember on top of the platform to kick things off.
    for (let x = x0 + platW / 2 - 3; x < x0 + platW / 2 + 3; x++) {
      const i = (y0 - 1) * W + Math.floor(x);
      grid[i] = FIRE;
      energy[i] = FIRE_LIFETIME;
    }

    return { grid, energy, width: W, height: H, pen: { x: 0, y: 0, down: false } };
  },

  step: ({ data, params, inputs, random }) => {
    const { fireSpreadChance, smokeFadeRate } = params;
    const grid = data.grid;
    const energy = data.energy;
    const pen = { ...data.pen };

    const idx = (x: number, y: number) => y * W + x;
    const inBounds = (x: number, y: number) => x >= 0 && x < W && y >= 0 && y < H;

    // Apply every queued stroke, then keep painting at the last position while
    // the pointer stays down — a held brush keeps depositing material.
    let painted = false;
    for (const input of inputs) {
      if (input.kind === 'lift') {
        pen.down = false;
        continue;
      }
      pen.x = input.x;
      pen.y = input.y;
      pen.down = true;
      paintBrush(grid, energy, input.x, input.y, params.brushSize, params.material);
      painted = true;
    }
    if (pen.down && !painted) {
      paintBrush(grid, energy, pen.x, pen.y, params.brushSize, params.material);
    }

    // --- Falling/settling materials: process bottom-to-top ---
    for (let y = H - 1; y >= 0; y--) {
      for (let x = 0; x < W; x++) {
        const i = idx(x, y);
        const c = grid[i];

        if (c === SAND) {
          if (y + 1 < H) {
            const below = idx(x, y + 1);
            if (grid[below] === EMPTY || grid[below] === WATER) {
              // Sink through water / fall into empty.
              grid[i] = grid[below];
              grid[below] = SAND;
              continue;
            }
            // Slide diagonally.
            const dir = random() < 0.5 ? -1 : 1;
            for (const dx of [dir, -dir]) {
              const nx = x + dx;
              if (inBounds(nx, y + 1)) {
                const di = idx(nx, y + 1);
                if (grid[di] === EMPTY || grid[di] === WATER) {
                  grid[i] = grid[di];
                  grid[di] = SAND;
                  break;
                }
              }
            }
          }
        } else if (c === WATER) {
          if (y + 1 < H && grid[idx(x, y + 1)] === EMPTY) {
            grid[i] = EMPTY;
            grid[idx(x, y + 1)] = WATER;
            continue;
          }
          // Diagonal down.
          const dir = random() < 0.5 ? -1 : 1;
          let moved = false;
          for (const dx of [dir, -dir]) {
            const nx = x + dx;
            if (inBounds(nx, y + 1) && grid[idx(nx, y + 1)] === EMPTY) {
              grid[i] = EMPTY;
              grid[idx(nx, y + 1)] = WATER;
              moved = true;
              break;
            }
          }
          if (moved) continue;
          // Spread sideways.
          for (const dx of [dir, -dir]) {
            const nx = x + dx;
            if (inBounds(nx, y) && grid[idx(nx, y)] === EMPTY) {
              grid[i] = EMPTY;
              grid[idx(nx, y)] = WATER;
              break;
            }
          }
        }
      }
    }

    // --- Fire: spread to combustible neighbors, then decay into smoke ---
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = idx(x, y);
        if (grid[i] !== FIRE) continue;

        if (energy[i] > 0) {
          // Try to ignite combustible (wood) neighbors.
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (!inBounds(nx, ny)) continue;
              const ni = idx(nx, ny);
              const nc = grid[ni];
              if (nc === WOOD && random() < fireSpreadChance) {
                grid[ni] = FIRE;
                energy[ni] = FIRE_LIFETIME;
              } else if (nc === WATER) {
                // Water extinguishes adjacent fire.
                grid[i] = SMOKE;
                energy[i] = SMOKE_LIFETIME * 0.5;
              }
            }
          }
        }

        energy[i] -= 0.05 + random() * 0.03;
        if (grid[i] === FIRE && energy[i] <= 0) {
          grid[i] = SMOKE;
          energy[i] = SMOKE_LIFETIME;
        }
      }
    }

    // --- Smoke: rise, drift, fade. Process top-to-bottom so it climbs. ---
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = idx(x, y);
        if (grid[i] !== SMOKE) continue;

        energy[i] -= smokeFadeRate;
        if (energy[i] <= 0) {
          grid[i] = EMPTY;
          continue;
        }

        // Rise into empty cell above, with a little horizontal drift.
        if (y - 1 >= 0) {
          const driftDir = random() < 0.5 ? -1 : 1;
          const candidates = [
            [x, y - 1],
            [x + driftDir, y - 1],
            [x - driftDir, y - 1],
          ];
          for (const [nx, ny] of candidates) {
            if (inBounds(nx, ny) && grid[idx(nx, ny)] === EMPTY) {
              grid[idx(nx, ny)] = SMOKE;
              energy[idx(nx, ny)] = energy[i];
              grid[i] = EMPTY;
              energy[i] = 0;
              break;
            }
          }
        }
      }
    }

    return { grid, energy, width: W, height: H, pen };
  },
});
