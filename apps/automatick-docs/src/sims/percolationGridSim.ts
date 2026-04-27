import { defineSim } from 'automatick/sim';
import {
  EMPTY,
  ROCK,
  WATER_FROM_TOP,
  WATER_FROM_LEFT,
  WATER_FROM_RIGHT,
  type PercolationData,
} from './percolationSim';

export type PercGridParams = {
  /** Number of rows of mini-grids (each row is an independent run at the col's porosity). */
  rows: number;
  /** Number of columns; each column uses a different porosity. */
  cols: number;
  /** Width of each mini-grid in cells. */
  width: number;
  /** Height of each mini-grid in cells. */
  height: number;
  /** Porosity for the leftmost column. */
  minP: number;
  /** Porosity increment per column. */
  stepP: number;
};

export type PercGridColMeta = {
  p: number;
  result: number;
  total: number;
};

export type PercGridData = {
  cells: PercolationData[][];
  colsMeta: PercGridColMeta[];
};

function initOne(width: number, height: number, porosity: number): PercolationData {
  const grid: number[][] = [];
  const queue: { x: number; y: number }[] = [];

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      row.push(Math.random() > porosity ? ROCK : EMPTY);
    }
    grid.push(row);
  }
  for (let x = 0; x < width; x++) {
    if (grid[0][x] === EMPTY) {
      grid[0][x] = WATER_FROM_TOP;
      queue.push({ x, y: 0 });
    }
  }
  return { grid, queue, result: 'pending' };
}

function stepOne(prev: PercolationData): PercolationData {
  if (prev.result !== 'pending') return prev;
  const { grid, queue } = prev;
  if (queue.length === 0) {
    return { grid, queue: [], result: 'failure' as const };
  }

  const height = grid.length;
  const nextQueue: { x: number; y: number }[] = [];
  let result: PercolationData['result'] = 'pending';

  for (const cell of queue) {
    const { x, y } = cell;
    if (y === height - 1) result = 'success';
    if (y + 1 < height && grid[y + 1][x] === EMPTY) {
      grid[y + 1][x] = WATER_FROM_TOP;
      nextQueue.push({ x, y: y + 1 });
    }
    if (x - 1 >= 0 && grid[y][x - 1] === EMPTY) {
      grid[y][x - 1] = WATER_FROM_RIGHT;
      nextQueue.push({ x: x - 1, y });
    }
    if (x + 1 < grid[0].length && grid[y][x + 1] === EMPTY) {
      grid[y][x + 1] = WATER_FROM_LEFT;
      nextQueue.push({ x: x + 1, y });
    }
  }
  if (nextQueue.length === 0 && result === 'pending') result = 'failure';
  return { grid, queue: nextQueue, result };
}

export default defineSim<PercGridData, PercGridParams>({
  defaultParams: {
    rows: 10,
    cols: 8,
    width: 24,
    height: 24,
    minP: 0.54,
    stepP: 0.02,
  },

  init: ({ rows, cols, width, height, minP, stepP }) => {
    const colsMeta: PercGridColMeta[] = Array.from({ length: cols }, (_, c) => ({
      p: minP + c * stepP,
      result: 0,
      total: rows,
    }));
    const cells: PercolationData[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, (_, c) => initOne(width, height, colsMeta[c].p))
    );
    return { cells, colsMeta };
  },

  step: ({ data }) => {
    const colsMeta = data.colsMeta.map((m) => ({ ...m }));
    const cells = data.cells.map((row, y) =>
      row.map((cell, x) => {
        if (cell.result !== 'pending') return cell;
        const next = stepOne(cell);
        if (next.result === 'success' && cell.result === 'pending') {
          colsMeta[x].result += 1;
        }
        return next;
      })
    );
    return { cells, colsMeta };
  },

  shouldStop: (data) =>
    data.cells.every((row) => row.every((c) => c.result !== 'pending')),
});
