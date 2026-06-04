import { defineSim } from 'automatick/sim';

export type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  fixed: boolean;
};

export type Spring = {
  a: number;
  b: number;
  restLength: number;
};

export type SpringMassData = {
  nodes: Node[];
  springs: Spring[];
  width: number;
  height: number;
};

export type SpringMassParams = {
  stiffness: number;
  damping: number;
  gravity: number;
  preset: 'chain' | 'grid' | 'bridge';
  gridSize: number;
};

const SUBSTEPS = 4;

function dist(a: Node, b: Node): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function buildChain(width: number, height: number): SpringMassData {
  const nodes: Node[] = [];
  const springs: Spring[] = [];
  const count = 14;
  const startX = width * 0.5;
  const startY = height * 0.15;
  const gap = (height * 0.6) / (count - 1);
  for (let i = 0; i < count; i++) {
    nodes.push({
      // Slight horizontal kick so the chain swings immediately.
      x: startX + (i === 0 ? 0 : i * 6),
      y: startY + i * gap,
      vx: 0,
      vy: 0,
      mass: 1,
      fixed: i === 0,
    });
  }
  for (let i = 0; i < count - 1; i++) {
    springs.push({ a: i, b: i + 1, restLength: gap });
  }
  return { nodes, springs, width, height };
}

function buildGrid(
  width: number,
  height: number,
  gridSize: number
): SpringMassData {
  const nodes: Node[] = [];
  const springs: Spring[] = [];
  const cols = gridSize;
  const rows = gridSize;
  const spacing = Math.min(width, height) * 0.5 / Math.max(cols - 1, 1);
  const offsetX = (width - (cols - 1) * spacing) / 2;
  const offsetY = height * 0.12;

  const idx = (r: number, c: number) => r * cols + c;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      nodes.push({
        x: offsetX + c * spacing,
        y: offsetY + r * spacing,
        vx: 0,
        vy: 0,
        mass: 1,
        // Pin the top row so the jelly hangs and wobbles.
        fixed: r === 0 && (c === 0 || c === cols - 1),
      });
    }
  }

  const connect = (r1: number, c1: number, r2: number, c2: number) => {
    if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= cols) return;
    const a = idx(r1, c1);
    const b = idx(r2, c2);
    springs.push({ a, b, restLength: dist(nodes[a], nodes[b]) });
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      connect(r, c, r, c + 1); // right
      connect(r, c, r + 1, c); // down
      connect(r, c, r + 1, c + 1); // diagonal
      if (c > 0) connect(r, c, r + 1, c - 1); // anti-diagonal
    }
  }
  return { nodes, springs, width, height };
}

function buildBridge(width: number, height: number): SpringMassData {
  const nodes: Node[] = [];
  const springs: Spring[] = [];
  const count = 16;
  const startX = width * 0.1;
  const span = width * 0.8;
  const gap = span / (count - 1);
  const y = height * 0.4;
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: startX + i * gap,
      y,
      vx: 0,
      vy: 0,
      mass: 1,
      // Anchor both endpoints.
      fixed: i === 0 || i === count - 1,
    });
  }
  for (let i = 0; i < count - 1; i++) {
    springs.push({ a: i, b: i + 1, restLength: gap });
  }
  // Bracing every-other span to make the deck stiffer.
  for (let i = 0; i < count - 2; i++) {
    springs.push({ a: i, b: i + 2, restLength: gap * 2 });
  }
  return { nodes, springs, width, height };
}

export default defineSim<SpringMassData, SpringMassParams>({
  defaultParams: {
    stiffness: 2,
    damping: 0.02,
    gravity: 0.6,
    preset: 'grid',
    gridSize: 8,
  },

  init: (params) => {
    const width = 600;
    const height = 600;
    switch (params.preset) {
      case 'chain':
        return buildChain(width, height);
      case 'bridge':
        return buildBridge(width, height);
      case 'grid':
      default:
        return buildGrid(width, height, params.gridSize);
    }
  },

  step: ({ data, params }) => {
    const { stiffness, damping, gravity } = params;
    const { nodes, springs, height } = data;
    const dt = 1 / SUBSTEPS;
    const dampFactor = 1 - damping;

    for (let s = 0; s < SUBSTEPS; s++) {
      // Accumulate spring forces.
      const fx = new Float64Array(nodes.length);
      const fy = new Float64Array(nodes.length);

      for (let i = 0; i < springs.length; i++) {
        const sp = springs[i];
        const na = nodes[sp.a];
        const nb = nodes[sp.b];
        const dx = nb.x - na.x;
        const dy = nb.y - na.y;
        const len = Math.hypot(dx, dy) || 1e-6;
        // Hooke's law: F = -k (len - rest), along the spring axis.
        const force = stiffness * (len - sp.restLength);
        const ux = dx / len;
        const uy = dy / len;
        fx[sp.a] += ux * force;
        fy[sp.a] += uy * force;
        fx[sp.b] -= ux * force;
        fy[sp.b] -= uy * force;
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.fixed) {
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        const ax = fx[i] / n.mass;
        const ay = fy[i] / n.mass + gravity;
        n.vx = (n.vx + ax * dt) * dampFactor;
        n.vy = (n.vy + ay * dt) * dampFactor;
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        // Soft floor so falling structures settle on the bottom edge.
        if (n.y > height - 4) {
          n.y = height - 4;
          n.vy *= -0.4;
        }
      }
    }

    return data;
  },
});
