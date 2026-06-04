import { defineSim } from 'automatick/sim';

export type ClothPoint = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  pinned: boolean;
};

export type ClothConstraint = {
  a: number;
  b: number;
  restLength: number;
};

export type ClothData = {
  points: ClothPoint[];
  constraints: ClothConstraint[];
  cols: number;
  rows: number;
  width: number;
  height: number;
};

export type ClothParams = {
  cols: number;
  rows: number;
  gravity: number;
  damping: number;
  constraintIterations: number;
  preset: 'cloth' | 'rope';
  tearThreshold: number;
  width: number;
  height: number;
};

function buildCloth(params: ClothParams): ClothData {
  const { cols, rows, width, height } = params;
  const points: ClothPoint[] = [];
  // Lay the grid out across the upper-middle of the canvas with a margin.
  const spacing = Math.min(
    (width * 0.7) / Math.max(cols - 1, 1),
    (height * 0.55) / Math.max(rows - 1, 1)
  );
  const startX = (width - spacing * (cols - 1)) / 2;
  const startY = height * 0.12;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * spacing;
      const y = startY + r * spacing;
      // Pin a few points along the top row so the sheet hangs.
      const pinned = r === 0 && c % Math.max(1, Math.floor(cols / 6)) === 0;
      points.push({ x, y, prevX: x, prevY: y, pinned });
    }
  }

  const idx = (r: number, c: number) => r * cols + c;
  const constraints: ClothConstraint[] = [];
  const addConstraint = (a: number, b: number) => {
    const pa = points[a];
    const pb = points[b];
    constraints.push({
      a,
      b,
      restLength: Math.hypot(pa.x - pb.x, pa.y - pb.y),
    });
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c < cols - 1) addConstraint(idx(r, c), idx(r, c + 1)); // horizontal
      if (r < rows - 1) addConstraint(idx(r, c), idx(r + 1, c)); // vertical
    }
  }

  return { points, constraints, cols, rows, width, height };
}

function buildRope(params: ClothParams): ClothData {
  const { rows, width, height } = params;
  const count = Math.max(rows, 2) * 2;
  const points: ClothPoint[] = [];
  const spacing = (height * 0.7) / Math.max(count - 1, 1);
  const startX = width / 2;
  const startY = height * 0.12;

  for (let i = 0; i < count; i++) {
    const x = startX;
    const y = startY + i * spacing;
    points.push({ x, y, prevX: x, prevY: y, pinned: i === 0 });
  }

  const constraints: ClothConstraint[] = [];
  for (let i = 0; i < count - 1; i++) {
    constraints.push({ a: i, b: i + 1, restLength: spacing });
  }

  return { points, constraints, cols: 1, rows: count, width, height };
}

export default defineSim<ClothData, ClothParams>({
  defaultParams: {
    cols: 28,
    rows: 18,
    gravity: 0.4,
    damping: 0.99,
    constraintIterations: 5,
    preset: 'cloth',
    tearThreshold: 0,
    width: 600,
    height: 600,
  },

  init: (params) =>
    params.preset === 'rope' ? buildRope(params) : buildCloth(params),

  step: ({ data, params }) => {
    const { gravity, damping, constraintIterations, tearThreshold } = params;
    const points = data.points.map((p) => ({ ...p }));
    let constraints = data.constraints;

    // 1. Verlet integration (implicit velocity from position delta).
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.pinned) continue;
      const vx = (p.x - p.prevX) * damping;
      const vy = (p.y - p.prevY) * damping;
      p.prevX = p.x;
      p.prevY = p.y;
      p.x += vx;
      p.y += vy + gravity;
    }

    // 2. Constraint relaxation, iterated for stiffness. Tearing optional.
    const broken = tearThreshold > 0 ? new Set<number>() : null;
    for (let iter = 0; iter < constraintIterations; iter++) {
      for (let ci = 0; ci < constraints.length; ci++) {
        if (broken && broken.has(ci)) continue;
        const con = constraints[ci];
        const pa = points[con.a];
        const pb = points[con.b];
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.hypot(dx, dy) || 0.0001;

        if (broken && dist > con.restLength * tearThreshold) {
          broken.add(ci);
          continue;
        }

        const diff = (con.restLength - dist) / dist;
        const offsetX = dx * 0.5 * diff;
        const offsetY = dy * 0.5 * diff;

        if (!pa.pinned && !pb.pinned) {
          pa.x -= offsetX;
          pa.y -= offsetY;
          pb.x += offsetX;
          pb.y += offsetY;
        } else if (pa.pinned && !pb.pinned) {
          pb.x += offsetX * 2;
          pb.y += offsetY * 2;
        } else if (!pa.pinned && pb.pinned) {
          pa.x -= offsetX * 2;
          pa.y -= offsetY * 2;
        }
      }
    }

    if (broken && broken.size > 0) {
      constraints = constraints.filter((_, i) => !broken.has(i));
    }

    return { ...data, points, constraints };
  },
});
