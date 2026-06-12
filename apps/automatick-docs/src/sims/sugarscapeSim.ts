import { defineSim } from 'automatick/sim';

export type SugarAgent = {
  x: number;
  y: number;
  sugar: number;
  metabolism: number;
  vision: number;
};

export type SugarscapeData = {
  sugarGrid: Float32Array;
  capacityGrid: Float32Array;
  agents: SugarAgent[];
  giniCoefficient: number;
  aliveCount: number;
  width: number;
  height: number;
};

export type SugarscapeParams = {
  gridSize: number;
  numAgents: number;
  sugarGrowbackRate: number;
  maxMetabolism: number;
  maxVision: number;
};

export const MAX_CAPACITY = 4;

function gaussianPeak(
  x: number,
  y: number,
  cx: number,
  cy: number,
  spread: number
): number {
  const dx = x - cx;
  const dy = y - cy;
  return MAX_CAPACITY * Math.exp(-(dx * dx + dy * dy) / (2 * spread * spread));
}

function buildCapacity(size: number): Float32Array {
  const grid = new Float32Array(size * size);
  const spread = size * 0.18;
  const c1x = size * 0.3;
  const c1y = size * 0.3;
  const c2x = size * 0.7;
  const c2y = size * 0.7;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cap = Math.max(
        gaussianPeak(x, y, c1x, c1y, spread),
        gaussianPeak(x, y, c2x, c2y, spread)
      );
      grid[y * size + x] = Math.round(cap);
    }
  }
  return grid;
}

function computeGini(agents: SugarAgent[]): number {
  const n = agents.length;
  if (n === 0) return 0;
  const wealth = agents.map((a) => a.sugar).sort((a, b) => a - b);
  let cumWeighted = 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    cumWeighted += (i + 1) * wealth[i];
    total += wealth[i];
  }
  if (total === 0) return 0;
  return (2 * cumWeighted) / (n * total) - (n + 1) / n;
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default defineSim<SugarscapeData, SugarscapeParams>({
  defaultParams: {
    gridSize: 50,
    numAgents: 200,
    sugarGrowbackRate: 1,
    maxMetabolism: 4,
    maxVision: 6,
  },

  init: (params, { random }) => {
    const size = params.gridSize;
    const capacityGrid = buildCapacity(size);
    const sugarGrid = new Float32Array(capacityGrid);

    const occupied = new Set<number>();
    const agents: SugarAgent[] = [];
    const target = Math.min(params.numAgents, size * size);
    while (agents.length < target) {
      const x = random.int(0, size - 1);
      const y = random.int(0, size - 1);
      const key = y * size + x;
      if (occupied.has(key)) continue;
      occupied.add(key);
      agents.push({
        x,
        y,
        sugar: 5 + random() * 20,
        metabolism: random.int(1, params.maxMetabolism),
        vision: random.int(1, params.maxVision),
      });
    }

    return {
      sugarGrid,
      capacityGrid,
      agents,
      giniCoefficient: computeGini(agents),
      aliveCount: agents.length,
      width: size,
      height: size,
    };
  },

  step: ({ data, params, random }) => {
    const size = data.width;
    const sugarGrid = data.sugarGrid;
    const capacityGrid = data.capacityGrid;
    const growback = params.sugarGrowbackRate;

    // 1. Sugar growback toward capacity.
    for (let i = 0; i < sugarGrid.length; i++) {
      const cap = capacityGrid[i];
      if (sugarGrid[i] < cap) {
        sugarGrid[i] = Math.min(cap, sugarGrid[i] + growback);
      }
    }

    // Occupancy map so agents don't pile onto the same cell.
    const occupied = new Set<number>();
    for (const a of data.agents) occupied.add(a.y * size + a.x);

    const order = shuffle([...data.agents], random);
    const survivors: SugarAgent[] = [];

    for (const a of order) {
      // 2. Movement: look along 4 cardinal directions up to `vision`, pick the
      // visible unoccupied cell with the most sugar (ties broken by nearness).
      const here = a.y * size + a.x;
      let bestX = a.x;
      let bestY = a.y;
      let bestSugar = sugarGrid[here];
      let bestDist = 0;

      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const;
      for (const [dx, dy] of dirs) {
        for (let d = 1; d <= a.vision; d++) {
          const nx = a.x + dx * d;
          const ny = a.y + dy * d;
          if (nx < 0 || nx >= size || ny < 0 || ny >= size) break;
          const key = ny * size + nx;
          if (occupied.has(key)) continue;
          const s = sugarGrid[key];
          if (s > bestSugar || (s === bestSugar && (bestDist === 0 || d < bestDist))) {
            bestSugar = s;
            bestX = nx;
            bestY = ny;
            bestDist = d;
          }
        }
      }

      if (bestX !== a.x || bestY !== a.y) {
        occupied.delete(here);
        occupied.add(bestY * size + bestX);
        a.x = bestX;
        a.y = bestY;
      }

      // 3. Harvest the cell's sugar.
      const cell = a.y * size + a.x;
      a.sugar += sugarGrid[cell];
      sugarGrid[cell] = 0;

      // 4. Metabolism; die when sugar runs out.
      a.sugar -= a.metabolism;
      if (a.sugar > 0) {
        survivors.push(a);
      } else {
        occupied.delete(a.y * size + a.x);
      }
    }

    return {
      sugarGrid,
      capacityGrid,
      agents: survivors,
      giniCoefficient: computeGini(survivors),
      aliveCount: survivors.length,
      width: size,
      height: size,
    };
  },
});
