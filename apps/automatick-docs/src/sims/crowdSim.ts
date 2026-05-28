import { defineSim } from 'automatick/sim';

export type CrowdScenario = 'bidirectional' | 'bottleneck' | 'crossing';

export type CrowdAgent = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Desired unit direction of travel (axis-aligned per scenario). */
  dirX: number;
  dirY: number;
  radius: number;
  /** 0 or 1 — used for coloring by travel direction. */
  group: number;
};

export type Obstacle = { x: number; y: number; w: number; h: number };

export type CrowdData = {
  agents: CrowdAgent[];
  obstacles: Obstacle[];
  width: number;
  height: number;
};

export type CrowdParams = {
  numAgents: number;
  width: number;
  height: number;
  desiredSpeed: number;
  personalSpace: number;
  repulsionStrength: number;
  goalForce: number;
  scenario: CrowdScenario;
};

export const CROWD_W = 600;
export const CROWD_H = 600;

const RADIUS = 4.5;
const DT = 1;
const MAX_ACCEL = 40;
const BODY_STIFFNESS = 1.2; // linear push when agents actually overlap
const WALL_A_SCALE = 1.6; // walls repel a bit harder than agents
const WALL_B_SCALE = 0.6; // ...over a shorter range
const EXIT_MARGIN = 12;

// Corridor band (bidirectional) — open left/right, walls top/bottom.
const CORRIDOR_TOP = 150;
const CORRIDOR_BOT = 450;
// Bottleneck — vertical wall with a central gap.
const GAP_HALF = 36;
const WALL_THICK = 24;
// Crossing — width of each travel strip.
const STRIP_HALF = 110;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function obstaclesFor(scenario: CrowdScenario, W: number, H: number): Obstacle[] {
  if (scenario === 'bidirectional') {
    return [
      { x: 0, y: 0, w: W, h: CORRIDOR_TOP },
      { x: 0, y: CORRIDOR_BOT, w: W, h: H - CORRIDOR_BOT },
    ];
  }
  if (scenario === 'bottleneck') {
    const cx = W / 2 - WALL_THICK / 2;
    return [
      { x: cx, y: 0, w: WALL_THICK, h: H / 2 - GAP_HALF },
      { x: cx, y: H / 2 + GAP_HALF, w: WALL_THICK, h: H / 2 - GAP_HALF },
    ];
  }
  return []; // crossing: open field
}

/** Position a (re)spawning agent at its group's start side for the scenario. */
function placeAtStart(a: CrowdAgent, scenario: CrowdScenario, W: number, H: number): void {
  const r = Math.random;
  if (scenario === 'bidirectional') {
    const y = CORRIDOR_TOP + RADIUS + r() * (CORRIDOR_BOT - CORRIDOR_TOP - 2 * RADIUS);
    if (a.group === 0) {
      a.x = RADIUS + r() * 80;
      a.dirX = 1;
    } else {
      a.x = W - RADIUS - r() * 80;
      a.dirX = -1;
    }
    a.y = y;
    a.dirY = 0;
  } else if (scenario === 'bottleneck') {
    a.x = RADIUS + r() * 90;
    a.y = RADIUS + r() * (H - 2 * RADIUS);
    a.dirX = 1;
    a.dirY = 0;
  } else {
    // crossing
    if (a.group === 0) {
      a.x = RADIUS + r() * 80;
      a.y = H / 2 - STRIP_HALF + r() * (2 * STRIP_HALF);
      a.dirX = 1;
      a.dirY = 0;
    } else {
      a.x = W / 2 - STRIP_HALF + r() * (2 * STRIP_HALF);
      a.y = RADIUS + r() * 80;
      a.dirX = 0;
      a.dirY = 1;
    }
  }
  a.vx = a.dirX * 0.5;
  a.vy = a.dirY * 0.5;
}

function groupFor(scenario: CrowdScenario, index: number): number {
  if (scenario === 'bottleneck') return 0;
  return index % 2;
}

function makeAgent(scenario: CrowdScenario, group: number, W: number, H: number): CrowdAgent {
  const a: CrowdAgent = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    dirX: 1,
    dirY: 0,
    radius: RADIUS,
    group,
  };
  placeAtStart(a, scenario, W, H);
  return a;
}

/** Add/remove agents so the count matches `target`, keeping groups balanced. */
function reconcile(agents: CrowdAgent[], target: number, scenario: CrowdScenario, W: number, H: number): void {
  while (agents.length < target) {
    agents.push(makeAgent(scenario, groupFor(scenario, agents.length), W, H));
  }
  if (agents.length > target) agents.length = target;
}

function reachedGoal(a: CrowdAgent, W: number, H: number): boolean {
  if (a.dirX > 0.5) return a.x > W - EXIT_MARGIN;
  if (a.dirX < -0.5) return a.x < EXIT_MARGIN;
  if (a.dirY > 0.5) return a.y > H - EXIT_MARGIN;
  if (a.dirY < -0.5) return a.y < EXIT_MARGIN;
  return false;
}

export default defineSim<CrowdData, CrowdParams>({
  defaultParams: {
    numAgents: 160,
    width: CROWD_W,
    height: CROWD_H,
    desiredSpeed: 1.5,
    personalSpace: 10,
    repulsionStrength: 2.2,
    goalForce: 0.3,
    scenario: 'bidirectional',
  },

  init: (params) => {
    const { numAgents, width, height, scenario } = params;
    const agents: CrowdAgent[] = [];
    for (let i = 0; i < numAgents; i++) {
      agents.push(makeAgent(scenario, groupFor(scenario, i), width, height));
    }
    return { agents, obstacles: obstaclesFor(scenario, width, height), width, height };
  },

  step: ({ data, params }) => {
    const {
      numAgents,
      width: W,
      height: H,
      desiredSpeed,
      personalSpace: B,
      repulsionStrength: A,
      goalForce,
      scenario,
    } = params;

    const agents = data.agents;
    reconcile(agents, numAgents, scenario, W, H);
    const obstacles = data.obstacles;

    const n = agents.length;
    const maxSpeed = desiredSpeed * 1.3;
    const wallB = B * WALL_B_SCALE;
    const wallA = A * WALL_A_SCALE;
    const fx = new Float64Array(n);
    const fy = new Float64Array(n);

    // Phase 1: accumulate social forces from start-of-tick positions.
    for (let i = 0; i < n; i++) {
      const ai = agents[i];
      // Goal: relax toward desired velocity along travel direction.
      let X = goalForce * (desiredSpeed * ai.dirX - ai.vx);
      let Y = goalForce * (desiredSpeed * ai.dirY - ai.vy);

      // Agent–agent repulsion (exponential + body contact).
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const aj = agents[j];
        const dx = ai.x - aj.x;
        const dy = ai.y - aj.y;
        const d = Math.hypot(dx, dy);
        const sumR = ai.radius + aj.radius;
        if (d > sumR + 4 * B || d <= 0.0001) continue;
        const nx = dx / d;
        const ny = dy / d;
        const mag = A * Math.exp(Math.min((sumR - d) / B, 2));
        X += mag * nx;
        Y += mag * ny;
        if (d < sumR) {
          const push = BODY_STIFFNESS * (sumR - d);
          X += push * nx;
          Y += push * ny;
        }
      }

      // Obstacle (wall) repulsion from nearest point on each rectangle.
      for (const o of obstacles) {
        const cx = clamp(ai.x, o.x, o.x + o.w);
        const cy = clamp(ai.y, o.y, o.y + o.h);
        let dx = ai.x - cx;
        let dy = ai.y - cy;
        let d = Math.hypot(dx, dy);
        if (d < 0.0001) {
          // Inside the wall: push toward nearest vertical edge.
          dx = ai.x - (o.x + o.w / 2);
          d = Math.abs(dx) || 1;
          dy = 0;
        }
        if (d > ai.radius + 4 * wallB) continue;
        const nx = dx / d;
        const ny = dy / d;
        const mag = wallA * Math.exp(Math.min((ai.radius - d) / wallB, 2));
        X += mag * nx;
        Y += mag * ny;
        if (d < ai.radius) {
          const push = BODY_STIFFNESS * 2 * (ai.radius - d);
          X += push * nx;
          Y += push * ny;
        }
      }

      const am = Math.hypot(X, Y);
      if (am > MAX_ACCEL) {
        X = (X / am) * MAX_ACCEL;
        Y = (Y / am) * MAX_ACCEL;
      }
      fx[i] = X;
      fy[i] = Y;
    }

    // Phase 2: integrate and keep agents on the canvas.
    for (let i = 0; i < n; i++) {
      const a = agents[i];
      a.vx += fx[i] * DT;
      a.vy += fy[i] * DT;
      const sp = Math.hypot(a.vx, a.vy);
      if (sp > maxSpeed) {
        a.vx = (a.vx / sp) * maxSpeed;
        a.vy = (a.vy / sp) * maxSpeed;
      }
      a.x += a.vx * DT;
      a.y += a.vy * DT;
      a.x = clamp(a.x, a.radius, W - a.radius);
      a.y = clamp(a.y, a.radius, H - a.radius);

      if (reachedGoal(a, W, H)) {
        placeAtStart(a, scenario, W, H);
      }
    }

    return data;
  },
});
