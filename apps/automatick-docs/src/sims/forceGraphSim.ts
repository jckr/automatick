import { defineSim } from 'automatick/sim';
import type { SimRandom } from 'automatick/random';

export const FG_WIDTH = 600;
export const FG_HEIGHT = 600;

export type GraphNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree: number;
  group: number;
};

export type Edge = {
  source: number;
  target: number;
};

export type ForceGraphData = {
  nodes: GraphNode[];
  edges: Edge[];
  totalEnergy: number;
};

export type ForceGraphParams = {
  numNodes: number;
  edgeProbability: number;
  repulsionStrength: number;
  attractionStrength: number;
  damping: number;
  idealEdgeLength: number;
  preset: 'random' | 'tree' | 'clusters';
  centerGravity: number;
};

function buildGraph(
  params: ForceGraphParams,
  rand: SimRandom,
): {
  nodes: GraphNode[];
  edges: Edge[];
} {
  const n = params.numNodes;
  const cx = FG_WIDTH / 2;
  const cy = FG_HEIGHT / 2;

  const nodes: GraphNode[] = Array.from({ length: n }, () => ({
    x: cx + (rand() - 0.5) * FG_WIDTH * 0.6,
    y: cy + (rand() - 0.5) * FG_HEIGHT * 0.6,
    vx: 0,
    vy: 0,
    degree: 0,
    group: 0,
  }));

  const edges: Edge[] = [];
  const seen = new Set<string>();
  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source: a, target: b });
  };

  if (params.preset === 'tree') {
    // Random spanning tree: each new node attaches to an existing one.
    for (let i = 1; i < n; i++) {
      const parent = rand.int(0, i - 1);
      addEdge(parent, i);
    }
    // A few extra edges to make it less perfectly hierarchical.
    const extra = Math.floor(n * 0.1);
    for (let e = 0; e < extra; e++) {
      addEdge(rand.int(0, n - 1), rand.int(0, n - 1));
    }
  } else if (params.preset === 'clusters') {
    const numClusters = Math.min(5, Math.max(3, Math.floor(n / 12)));
    for (let i = 0; i < n; i++) {
      nodes[i].group = rand.int(0, numClusters - 1);
    }
    // Dense intra-cluster edges.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (nodes[i].group === nodes[j].group) {
          if (rand() < 0.35) addEdge(i, j);
        } else if (rand() < 0.004) {
          addEdge(i, j);
        }
      }
    }
    // Ensure every node has at least one edge within its cluster.
    for (let i = 0; i < n; i++) {
      if (edges.every((e) => e.source !== i && e.target !== i)) {
        for (let j = 0; j < n; j++) {
          if (j !== i && nodes[j].group === nodes[i].group) {
            addEdge(i, j);
            break;
          }
        }
      }
    }
  } else {
    // Erdős–Rényi random graph.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (rand() < params.edgeProbability) addEdge(i, j);
      }
    }
    // Connect any isolated nodes so nothing flies off alone.
    for (let i = 0; i < n; i++) {
      if (edges.every((e) => e.source !== i && e.target !== i)) {
        addEdge(i, rand.int(0, n - 1));
      }
    }
  }

  for (const e of edges) {
    nodes[e.source].degree++;
    nodes[e.target].degree++;
  }

  return { nodes, edges };
}

export default defineSim<ForceGraphData, ForceGraphParams>({
  defaultParams: {
    numNodes: 80,
    edgeProbability: 0.04,
    repulsionStrength: 3000,
    attractionStrength: 0.02,
    damping: 0.9,
    idealEdgeLength: 60,
    preset: 'clusters',
    centerGravity: 0.01,
  },

  init: (params, { random }) => {
    const { nodes, edges } = buildGraph(params, random);
    return { nodes, edges, totalEnergy: Infinity };
  },

  step: ({ data, params, random }) => {
    const { nodes, edges } = data;
    const {
      repulsionStrength,
      attractionStrength,
      damping,
      idealEdgeLength,
      centerGravity,
    } = params;
    const n = nodes.length;
    const cx = FG_WIDTH / 2;
    const cy = FG_HEIGHT / 2;

    const fx = new Float64Array(n);
    const fy = new Float64Array(n);

    // Coulomb-like repulsion between all node pairs.
    const maxForce = 1000;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = nodes[i].x - nodes[j].x;
        let dy = nodes[i].y - nodes[j].y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 0.01) {
          dx = (random() - 0.5) * 0.1;
          dy = (random() - 0.5) * 0.1;
          distSq = dx * dx + dy * dy + 0.01;
        }
        const dist = Math.sqrt(distSq);
        let f = repulsionStrength / distSq;
        if (f > maxForce) f = maxForce;
        const ux = dx / dist;
        const uy = dy / dist;
        fx[i] += ux * f;
        fy[i] += uy * f;
        fx[j] -= ux * f;
        fy[j] -= uy * f;
      }
    }

    // Spring (Hooke) attraction along edges.
    for (const e of edges) {
      const a = nodes[e.source];
      const b = nodes[e.target];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = attractionStrength * (dist - idealEdgeLength);
      const ux = dx / dist;
      const uy = dy / dist;
      fx[e.source] += ux * f;
      fy[e.source] += uy * f;
      fx[e.target] -= ux * f;
      fy[e.target] -= uy * f;
    }

    // Mild centering gravity + integration.
    let totalEnergy = 0;
    for (let i = 0; i < n; i++) {
      const node = nodes[i];
      fx[i] += (cx - node.x) * centerGravity;
      fy[i] += (cy - node.y) * centerGravity;

      node.vx = (node.vx + fx[i]) * damping;
      node.vy = (node.vy + fy[i]) * damping;

      // Clamp velocity to keep things stable.
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      const maxSpeed = 30;
      if (speed > maxSpeed) {
        node.vx = (node.vx / speed) * maxSpeed;
        node.vy = (node.vy / speed) * maxSpeed;
      }

      node.x += node.vx;
      node.y += node.vy;

      // Keep nodes inside bounds.
      if (node.x < 8) node.x = 8;
      if (node.x > FG_WIDTH - 8) node.x = FG_WIDTH - 8;
      if (node.y < 8) node.y = 8;
      if (node.y > FG_HEIGHT - 8) node.y = FG_HEIGHT - 8;

      totalEnergy += node.vx * node.vx + node.vy * node.vy;
    }

    return { nodes, edges, totalEnergy };
  },

  shouldStop: (data) => data.totalEnergy < 0.5,
});
