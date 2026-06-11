import { defineSim } from 'automatick/sim';

export const GRID = 100;

export type Agent = {
  x: number;
  y: number;
  resources: number;
  home: number;
  avoidSettlement: number;
  cooldown: number;
};

export type Settlement = {
  x: number;
  y: number;
  storedResources: number;
  buildings: number;
  population: number;
};

export type SettlementData = {
  resourceGrid: Float32Array;
  capacityGrid: Float32Array;
  agents: Agent[];
  settlements: Settlement[];
};

export type SettlementParams = {
  numAgents: number;
  resourceGrowback: number;
  settlementThreshold: number;
  buildCost: number;
  agentSpeed: number;
  gatherRadius: number;
};

function gaussianPeak(
  grid: Float32Array,
  cx: number,
  cy: number,
  height: number,
  sigma: number,
) {
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const dx = x - cx;
      const dy = y - cy;
      grid[y * GRID + x] += height * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
    }
  }
}

function bestResourceDirection(
  grid: Float32Array,
  ax: number,
  ay: number,
  radius: number,
): [number, number] {
  let bestVal = -1;
  let bx = 0;
  let by = 0;
  const r = Math.ceil(radius);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (dx * dx + dy * dy > radius * radius) continue;
      const nx = Math.round(ax) + dx;
      const ny = Math.round(ay) + dy;
      if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue;
      const val = grid[ny * GRID + nx];
      if (val > bestVal) {
        bestVal = val;
        bx = dx;
        by = dy;
      }
    }
  }
  if (bestVal <= 0) return [0, 0];
  const len = Math.sqrt(bx * bx + by * by) || 1;
  return [bx / len, by / len];
}

export default defineSim<SettlementData, SettlementParams>({
  defaultParams: {
    numAgents: 80,
    resourceGrowback: 0.01,
    settlementThreshold: 15,
    buildCost: 10,
    agentSpeed: 1.0,
    gatherRadius: 8,
  },

  init: (params, { random }) => {
    const capacity = new Float32Array(GRID * GRID);
    gaussianPeak(capacity, GRID * 0.25, GRID * 0.3, 1, 9);
    gaussianPeak(capacity, GRID * 0.45, GRID * 0.2, 0.7, 7);
    gaussianPeak(capacity, GRID * 0.7, GRID * 0.25, 0.85, 8);
    gaussianPeak(capacity, GRID * 0.2, GRID * 0.6, 0.6, 7);
    gaussianPeak(capacity, GRID * 0.5, GRID * 0.5, 1, 10);
    gaussianPeak(capacity, GRID * 0.75, GRID * 0.55, 0.7, 8);
    gaussianPeak(capacity, GRID * 0.35, GRID * 0.8, 0.85, 9);
    gaussianPeak(capacity, GRID * 0.65, GRID * 0.75, 0.6, 7);

    const resourceGrid = new Float32Array(capacity);

    const agents: Agent[] = [];
    for (let i = 0; i < params.numAgents; i++) {
      agents.push({
        x: random() * GRID,
        y: random() * GRID,
        resources: 0,
        home: -1,
        avoidSettlement: -1,
        cooldown: 0,
      });
    }

    return { resourceGrid, capacityGrid: capacity, agents, settlements: [] };
  },

  step: ({ data, params, random }) => {
    const { resourceGrid, capacityGrid, agents, settlements } = data;

    for (let i = 0; i < GRID * GRID; i++) {
      if (resourceGrid[i] < capacityGrid[i]) {
        resourceGrid[i] = Math.min(
          capacityGrid[i],
          resourceGrid[i] + params.resourceGrowback * capacityGrid[i],
        );
      }
    }

    for (const agent of agents) {
      const [dx, dy] = bestResourceDirection(
        resourceGrid,
        agent.x,
        agent.y,
        params.gatherRadius,
      );

      if (agent.home >= 0 && agent.resources >= 5) {
        const s = settlements[agent.home];
        const hx = s.x - agent.x;
        const hy = s.y - agent.y;
        const hLen = Math.sqrt(hx * hx + hy * hy);
        if (hLen > 1.5) {
          agent.x += (hx / hLen) * params.agentSpeed;
          agent.y += (hy / hLen) * params.agentSpeed;
        } else {
          s.storedResources += agent.resources;
          agent.resources = 0;
        }
      } else {
        agent.x += dx * params.agentSpeed + (random() - 0.5) * 0.3;
        agent.y += dy * params.agentSpeed + (random() - 0.5) * 0.3;
      }

      agent.x = Math.max(0, Math.min(GRID - 1, agent.x));
      agent.y = Math.max(0, Math.min(GRID - 1, agent.y));
    }

    const repelRadius = 4;
    for (let i = 0; i < agents.length; i++) {
      let rx = 0;
      let ry = 0;
      for (let j = 0; j < agents.length; j++) {
        if (i === j) continue;
        const dx = agents[i].x - agents[j].x;
        const dy = agents[i].y - agents[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < repelRadius * repelRadius && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const strength = (repelRadius - d) / repelRadius;
          rx += (dx / d) * strength;
          ry += (dy / d) * strength;
        }
      }
      agents[i].x = Math.max(0, Math.min(GRID - 1, agents[i].x + rx * 0.4));
      agents[i].y = Math.max(0, Math.min(GRID - 1, agents[i].y + ry * 0.4));
    }

    for (const agent of agents) {
      const gx = Math.floor(agent.x);
      const gy = Math.floor(agent.y);
      const gi = gy * GRID + gx;
      const harvest = Math.min(resourceGrid[gi], 0.5);
      if (harvest > 0.01) {
        agent.resources += harvest;
        resourceGrid[gi] -= harvest;
      }
    }

    for (const agent of agents) {
      if (agent.home >= 0) continue;
      if (agent.resources >= params.settlementThreshold) {
        let nearestJoinable = -1;
        let joinDist = 20;
        let tooClose = false;
        for (let si = 0; si < settlements.length; si++) {
          const s = settlements[si];
          const d = Math.sqrt(
            (s.x - agent.x) ** 2 + (s.y - agent.y) ** 2,
          );
          if (d < 25) tooClose = true;
          if (si === agent.avoidSettlement && agent.cooldown > 0) continue;
          if (d < joinDist) {
            joinDist = d;
            nearestJoinable = si;
          }
        }

        if (nearestJoinable >= 0) {
          const s = settlements[nearestJoinable];
          s.storedResources += agent.resources;
          s.population++;
          agent.resources = 0;
          agent.home = nearestJoinable;
        } else if (!tooClose) {
          const idx = settlements.length;
          settlements.push({
            x: agent.x,
            y: agent.y,
            storedResources: agent.resources,
            buildings: 1,
            population: 1,
          });
          agent.resources = 0;
          agent.home = idx;
        }
      }
    }

    for (let si = 0; si < settlements.length; si++) {
      const a = settlements[si];
      for (let sj = si + 1; sj < settlements.length; sj++) {
        const b = settlements[sj];
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (dist < 60) {
          const diff = a.storedResources - b.storedResources;
          const transfer = diff * 0.05;
          a.storedResources -= transfer;
          b.storedResources += transfer;
        }
      }
    }

    for (const s of settlements) {
      s.storedResources -= s.population * 0.5 + s.buildings * 0.2;
      if (s.storedResources >= params.buildCost) {
        s.storedResources -= params.buildCost;
        s.buildings++;
      }
      if (s.storedResources < 0) s.storedResources = 0;
    }

    for (const agent of agents) {
      if (agent.home < 0) {
        if (agent.cooldown > 0) agent.cooldown--;
        continue;
      }
      const s = settlements[agent.home];
      if (s.storedResources < 1 && random() < 0.08) {
        s.population = Math.max(0, s.population - 1);
        agent.avoidSettlement = agent.home;
        agent.cooldown = 150;
        agent.home = -1;
      }
    }

    for (const agent of agents) {
      if (agent.home >= 0) continue;
      let nearestSettlement = -1;
      let nearestDist = 20;
      for (let si = 0; si < settlements.length; si++) {
        if (si === agent.avoidSettlement && agent.cooldown > 0) continue;
        const s = settlements[si];
        const d = Math.sqrt((s.x - agent.x) ** 2 + (s.y - agent.y) ** 2);
        if (d < nearestDist) {
          nearestDist = d;
          nearestSettlement = si;
        }
      }
      if (nearestSettlement >= 0 && random() < 0.02) {
        settlements[nearestSettlement].population++;
        agent.home = nearestSettlement;
      }
    }

    return { resourceGrid, capacityGrid, agents, settlements };
  },
});
