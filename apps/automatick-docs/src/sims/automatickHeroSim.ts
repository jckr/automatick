import { defineSim } from 'automatick/sim';
import { getLetterMask, isInsideMask } from './automatickHeroMask';

export type HeroNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type HeroLink = {
  a: number;
  b: number;
};

export type HeroData = {
  nodes: HeroNode[];
  links: HeroLink[];
};

export type HeroParams = {
  width: number;
  height: number;
  /** Number of free-floating nodes. */
  nbNodes: number;
  /** Per-tick speed magnitude. */
  speed: number;
  /** Pair distance below which a link may form. */
  linkDistance: number;
  /** Per-pair-per-tick probability of being linked when at least one endpoint is outside the letter shape. */
  p: number;
  /** Per-pair-per-tick probability of being linked when BOTH endpoints are inside the letter shape. q >> p. */
  q: number;
  /** The word the nodes spell out via the higher in-shape link probability. */
  text: string;
  /** Show the underlying letter shape as a faint outline (visual debugging / explanation). */
  showMask: boolean;
};

const DEFAULT_PARAMS: HeroParams = {
  width: 1200,
  height: 380,
  nbNodes: 5000,
  speed: 0.3,
  linkDistance: 22,
  p: 0.005,
  q: 0.5,
  text: 'automatick',
  showMask: false,
};

function seedNodes(params: HeroParams): HeroNode[] {
  const { nbNodes, width, height, speed } = params;
  const nodes: HeroNode[] = new Array(nbNodes);
  for (let i = 0; i < nbNodes; i++) {
    const angle = Math.random() * Math.PI * 2;
    nodes[i] = {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    };
  }
  return nodes;
}

export default defineSim<HeroData, HeroParams>({
  defaultParams: DEFAULT_PARAMS,
  init: (params) => ({
    nodes: seedNodes(params),
    links: [],
  }),
  step: ({ data, params }) => {
    const { width, height, speed, linkDistance, p, q, text } = params;
    const N = data.nodes.length;
    const linkDistanceSq = linkDistance * linkDistance;

    const mask = getLetterMask(text, width, height);

    // Move nodes (world-wrap on edges). Velocity magnitude is renormalized
    // each tick so the `speed` slider has immediate visible effect.
    const nodes: HeroNode[] = new Array(N);
    for (let i = 0; i < N; i++) {
      const n = data.nodes[i];
      const mag = Math.hypot(n.vx, n.vy) || 1;
      const vx = (n.vx / mag) * speed;
      const vy = (n.vy / mag) * speed;
      let x = n.x + vx;
      let y = n.y + vy;
      if (x < 0) x += width;
      else if (x >= width) x -= width;
      if (y < 0) y += height;
      else if (y >= height) y -= height;
      nodes[i] = { x, y, vx, vy };
    }

    // Links are re-evaluated from scratch every tick. No persistence: a pair
    // is linked this tick iff (a) they're within linkDistance and (b) a
    // probability roll passes — q if both endpoints are inside the letter
    // shape, p otherwise. The visible logo is the steady-state density of
    // these per-tick rolls, not an accumulating set.
    const links: HeroLink[] = [];

    // Spatial bin to keep the pair scan cheap. Cell size = linkDistance.
    const cellSize = Math.max(1, linkDistance);
    const cols = Math.max(1, Math.ceil(width / cellSize));
    const rows = Math.max(1, Math.ceil(height / cellSize));
    const grid: number[][] = new Array(cols * rows);
    for (let g = 0; g < grid.length; g++) grid[g] = [];
    for (let i = 0; i < N; i++) {
      const c = Math.min(cols - 1, Math.floor(nodes[i].x / cellSize));
      const r = Math.min(rows - 1, Math.floor(nodes[i].y / cellSize));
      grid[r * cols + c].push(i);
    }

    // Scan each cell against itself + 4 neighbors (right, down-left, down, down-right).
    // Pairs (i,j) with i < j only.
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r * cols + c];
        const neighbors: number[] = [];
        for (const idx of cell) neighbors.push(idx);
        if (c + 1 < cols) for (const idx of grid[r * cols + (c + 1)]) neighbors.push(idx);
        if (r + 1 < rows && c > 0) for (const idx of grid[(r + 1) * cols + (c - 1)]) neighbors.push(idx);
        if (r + 1 < rows) for (const idx of grid[(r + 1) * cols + c]) neighbors.push(idx);
        if (r + 1 < rows && c + 1 < cols) for (const idx of grid[(r + 1) * cols + (c + 1)]) neighbors.push(idx);

        for (let k = 0; k < cell.length; k++) {
          const i = cell[k];
          const ni = nodes[i];
          for (let m = 0; m < neighbors.length; m++) {
            const j = neighbors[m];
            if (j <= i) continue;
            const nj = nodes[j];
            const dx = ni.x - nj.x;
            const dy = ni.y - nj.y;
            const dsq = dx * dx + dy * dy;
            if (dsq > linkDistanceSq) continue;

            const insideI = isInsideMask(mask, ni.x, ni.y);
            const insideJ = isInsideMask(mask, nj.x, nj.y);
            const prob = insideI && insideJ ? q : p;
            if (Math.random() < prob) {
              links.push({ a: i, b: j });
            }
          }
        }
      }
    }

    return { nodes, links };
  },
});
