import { defineSim } from 'automatick/sim';
import type { CrowdScenario, Obstacle } from './crowdSim';

// Two crowds, same scenario and params, run side by side:
//   • "selfish"     — autonomous agents that go as fast as they can and shove
//                     past each other (the social-force model).
//   • "coordinated" — agents follow assigned itineraries at a steady pace,
//                     never pushing: lanes are pre-assigned, an intersection is
//                     signalled, and they queue (car-following) instead of
//                     colliding.
// The chart races their cumulative arrivals so you can compare throughput.

export type CmpAgent = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dirX: number;
  dirY: number;
  radius: number;
  group: number;
  // Coordinated routing state (ignored by the selfish world):
  wx: number;
  wy: number;
  stage: number;
};

type World = { agents: CmpAgent[]; completed: number };

export type CrowdCompareData = {
  selfish: World;
  coordinated: World;
  obstacles: Obstacle[];
  width: number;
  height: number;
};

export type CrowdCompareParams = {
  numAgents: number;
  width: number;
  height: number;
  desiredSpeed: number;
  personalSpace: number;
  scenario: CrowdScenario;
};

export const CMP_W = 600;
export const CMP_H = 600;

const RADIUS = 4.5;
const DT = 1;
const MAX_ACCEL = 40;
const BODY_STIFFNESS = 1.2;
const WALL_A_SCALE = 1.6;
const WALL_B_SCALE = 0.6;
const EXIT_MARGIN = 12;
const SELFISH_A = 2.2;
const SELFISH_GOAL = 0.3;

const CORRIDOR_TOP = 150;
const CORRIDOR_BOT = 450;
const GAP_HALF = 36;
const WALL_THICK = 24;
const STRIP_HALF = 110;

// Crossing signal: alternate which stream may enter the central box.
const PHASE_LEN = 180;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function obstaclesFor(scenario: CrowdScenario, W: number, H: number): Obstacle[] {
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
  return [];
}

function groupFor(scenario: CrowdScenario, index: number): number {
  return scenario === 'bottleneck' ? 0 : index % 2;
}

function blankAgent(group: number): CmpAgent {
  return { x: 0, y: 0, vx: 0, vy: 0, dirX: 1, dirY: 0, radius: RADIUS, group, wx: 0, wy: 0, stage: 0 };
}

// ---- Selfish world: reactive social-force placement ----
function placeSelfish(a: CmpAgent, scenario: CrowdScenario, W: number, H: number): void {
  const r = Math.random;
  if (scenario === 'bidirectional') {
    a.y = CORRIDOR_TOP + RADIUS + r() * (CORRIDOR_BOT - CORRIDOR_TOP - 2 * RADIUS);
    if (a.group === 0) {
      a.x = RADIUS + r() * 80;
      a.dirX = 1;
    } else {
      a.x = W - RADIUS - r() * 80;
      a.dirX = -1;
    }
    a.dirY = 0;
  } else if (scenario === 'bottleneck') {
    a.x = RADIUS + r() * 90;
    a.y = RADIUS + r() * (H - 2 * RADIUS);
    a.dirX = 1;
    a.dirY = 0;
  } else if (a.group === 0) {
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
  a.vx = a.dirX * 0.5;
  a.vy = a.dirY * 0.5;
}

// ---- Coordinated world: assigned lanes + itinerary waypoints ----
function placeCoordinated(a: CmpAgent, scenario: CrowdScenario, W: number, H: number): void {
  const r = Math.random;
  a.vx = 0;
  a.vy = 0;
  a.stage = 0;
  if (scenario === 'bidirectional') {
    // Each direction gets its own half of the corridor — no conflict.
    const mid = (CORRIDOR_TOP + CORRIDOR_BOT) / 2;
    const pad = RADIUS + 4;
    if (a.group === 0) {
      a.y = CORRIDOR_TOP + pad + r() * (mid - CORRIDOR_TOP - 2 * pad);
      a.x = RADIUS + r() * 80;
      a.dirX = 1;
      a.wx = W + 30;
    } else {
      a.y = mid + pad + r() * (CORRIDOR_BOT - mid - 2 * pad);
      a.x = W - RADIUS - r() * 80;
      a.dirX = -1;
      a.wx = -30;
    }
    a.dirY = 0;
    a.wy = a.y;
  } else if (scenario === 'bottleneck') {
    a.x = RADIUS + r() * 90;
    a.y = RADIUS + r() * (H - 2 * RADIUS);
    a.dirX = 1;
    a.dirY = 0;
    // Assign a queue lane spread across the gap opening (keeps relative order),
    // so agents pass several abreast instead of jamming at a single point.
    const pad = RADIUS + 1;
    a.wx = W / 2;
    a.wy = H / 2 - GAP_HALF + pad + (a.y / H) * (2 * (GAP_HALF - pad));
  } else if (a.group === 0) {
    a.x = RADIUS + r() * 80;
    a.y = H / 2 - STRIP_HALF + r() * (2 * STRIP_HALF);
    a.dirX = 1;
    a.dirY = 0;
    a.wx = W + 30;
    a.wy = a.y;
  } else {
    a.x = W / 2 - STRIP_HALF + r() * (2 * STRIP_HALF);
    a.y = RADIUS + r() * 80;
    a.dirX = 0;
    a.dirY = 1;
    a.wx = a.x;
    a.wy = H + 30;
  }
}

function reconcile(
  world: World,
  target: number,
  scenario: CrowdScenario,
  W: number,
  H: number,
  place: (a: CmpAgent, s: CrowdScenario, W: number, H: number) => void
): void {
  const agents = world.agents;
  while (agents.length < target) {
    const a = blankAgent(groupFor(scenario, agents.length));
    place(a, scenario, W, H);
    agents.push(a);
  }
  if (agents.length > target) agents.length = target;
}

function reachedEdge(a: CmpAgent, W: number, H: number): boolean {
  if (a.dirX > 0.5) return a.x > W - EXIT_MARGIN;
  if (a.dirX < -0.5) return a.x < EXIT_MARGIN;
  if (a.dirY > 0.5) return a.y > H - EXIT_MARGIN;
  if (a.dirY < -0.5) return a.y < EXIT_MARGIN;
  return false;
}

function stepSelfish(
  world: World,
  obstacles: Obstacle[],
  p: CrowdCompareParams
): void {
  const { width: W, height: H, desiredSpeed, personalSpace: B, scenario } = p;
  const agents = world.agents;
  const n = agents.length;
  const maxSpeed = desiredSpeed * 1.3;
  const wallB = B * WALL_B_SCALE;
  const wallA = SELFISH_A * WALL_A_SCALE;
  const fx = new Float64Array(n);
  const fy = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const ai = agents[i];
    let X = SELFISH_GOAL * (desiredSpeed * ai.dirX - ai.vx);
    let Y = SELFISH_GOAL * (desiredSpeed * ai.dirY - ai.vy);
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
      const mag = SELFISH_A * Math.exp(Math.min((sumR - d) / B, 2));
      X += mag * nx;
      Y += mag * ny;
      if (d < sumR) {
        const push = BODY_STIFFNESS * (sumR - d);
        X += push * nx;
        Y += push * ny;
      }
    }
    for (const o of obstacles) {
      const cx = clamp(ai.x, o.x, o.x + o.w);
      const cy = clamp(ai.y, o.y, o.y + o.h);
      let dx = ai.x - cx;
      let dy = ai.y - cy;
      let d = Math.hypot(dx, dy);
      if (d < 0.0001) {
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
    if (reachedEdge(a, W, H)) {
      placeSelfish(a, scenario, W, H);
      world.completed++;
    }
  }
}

function stepCoordinated(
  world: World,
  p: CrowdCompareParams,
  tick: number
): void {
  const { width: W, height: H, desiredSpeed, scenario } = p;
  const agents = world.agents;
  const n = agents.length;
  const minGap = 2 * RADIUS + 3;
  const boxLeft = W / 2 - STRIP_HALF;
  const boxTop = H / 2 - STRIP_HALF;
  const horizontalGreen = Math.floor(tick / PHASE_LEN) % 2 === 0;

  for (let i = 0; i < n; i++) {
    const ai = agents[i];
    const ddx = ai.wx - ai.x;
    const ddy = ai.wy - ai.y;
    const dist = Math.hypot(ddx, ddy) || 1;
    const dx = ddx / dist;
    const dy = ddy / dist;

    let go = true;

    // Crossing signal: hold before the intersection on a red light.
    if (scenario === 'crossing') {
      const green = ai.group === 0 ? horizontalGreen : !horizontalGreen;
      if (!green) {
        if (ai.group === 0 && ai.x < boxLeft && ai.x + desiredSpeed >= boxLeft - 2) {
          go = false;
        } else if (ai.group === 1 && ai.y < boxTop && ai.y + desiredSpeed >= boxTop - 2) {
          go = false;
        }
      }
    }

    // Car-following: stop if another agent is close ahead (no pushing).
    if (go) {
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const aj = agents[j];
        const rx = aj.x - ai.x;
        const ry = aj.y - ai.y;
        const forward = rx * dx + ry * dy;
        if (forward <= 0 || forward > minGap) continue;
        const lateral = Math.abs(rx * dy - ry * dx);
        if (lateral < 2 * RADIUS) {
          go = false;
          break;
        }
      }
    }

    const speed = go ? desiredSpeed : 0;
    ai.vx = dx * speed;
    ai.vy = dy * speed;
    ai.x += ai.vx;
    ai.y += ai.vy;

    // Waypoint / exit handling.
    if (scenario === 'bottleneck' && ai.stage === 0) {
      // Reached the gap; continue straight through on the same lane (keep wy).
      if (ai.x >= W / 2 - 1) {
        ai.stage = 1;
        ai.wx = W + 30;
        ai.dirX = 1;
        ai.dirY = 0;
      }
    } else if (reachedEdge(ai, W, H)) {
      placeCoordinated(ai, scenario, W, H);
      world.completed++;
    }
  }
}

export default defineSim<CrowdCompareData, CrowdCompareParams>({
  defaultParams: {
    numAgents: 160,
    width: CMP_W,
    height: CMP_H,
    desiredSpeed: 1.5,
    personalSpace: 10,
    scenario: 'bidirectional',
  },

  init: (params) => {
    const { numAgents, width, height, scenario } = params;
    const selfish: World = { agents: [], completed: 0 };
    const coordinated: World = { agents: [], completed: 0 };
    reconcile(selfish, numAgents, scenario, width, height, placeSelfish);
    reconcile(coordinated, numAgents, scenario, width, height, placeCoordinated);
    return {
      selfish,
      coordinated,
      obstacles: obstaclesFor(scenario, width, height),
      width,
      height,
    };
  },

  step: ({ data, params, tick }) => {
    const { numAgents, width, height, scenario } = params;
    reconcile(data.selfish, numAgents, scenario, width, height, placeSelfish);
    reconcile(data.coordinated, numAgents, scenario, width, height, placeCoordinated);
    stepSelfish(data.selfish, data.obstacles, params);
    stepCoordinated(data.coordinated, params, tick);
    return data;
  },
});
