import { defineSim } from 'automatick/sim';
import type { SimRandom } from 'automatick/random';

export type OpinionAgent = {
  x: number;
  y: number;
  opinion: number; // continuous value in [0, 1]
};

export type OpinionData = {
  agents: OpinionAgent[];
  averageOpinion: number;
  polarization: number; // variance of opinions
  clusters: number; // number of distinct opinion clusters
  worldSize: number;
};

export type OpinionDistribution = 'uniform' | 'bimodal' | 'clustered';

export type OpinionParams = {
  numAgents: number;
  worldSize: number;
  interactionRadius: number;
  tolerance: number;
  influenceStrength: number;
  noise: number;
  initialDistribution: OpinionDistribution;
};

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function gaussian(random: SimRandom): number {
  // Box-Muller.
  const u = random() || 1e-9;
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function initialOpinion(
  dist: OpinionDistribution,
  centers: number[],
  random: SimRandom,
): number {
  if (dist === 'uniform') return random();
  if (dist === 'bimodal') {
    const c = random() < 0.5 ? 0.2 : 0.8;
    return clamp01(c + gaussian(random) * 0.06);
  }
  // clustered
  const c = random.pick(centers);
  return clamp01(c + gaussian(random) * 0.05);
}

function aggregate(agents: OpinionAgent[]): {
  averageOpinion: number;
  polarization: number;
  clusters: number;
} {
  const n = agents.length;
  if (n === 0) return { averageOpinion: 0, polarization: 0, clusters: 0 };
  let sum = 0;
  for (const a of agents) sum += a.opinion;
  const mean = sum / n;
  let varSum = 0;
  for (const a of agents) {
    const d = a.opinion - mean;
    varSum += d * d;
  }
  const polarization = varSum / n;

  // Cluster count: sort opinions, start a new cluster when a gap > 0.05 appears.
  const sorted = agents.map((a) => a.opinion).sort((p, q) => p - q);
  let clusters = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] > 0.05) clusters++;
  }
  return { averageOpinion: mean, polarization, clusters };
}

export default defineSim<OpinionData, OpinionParams>({
  defaultParams: {
    numAgents: 250,
    worldSize: 600,
    interactionRadius: 80,
    tolerance: 0.25,
    influenceStrength: 0.15,
    noise: 0.002,
    initialDistribution: 'uniform',
  },

  init: (params, { random }) => {
    const { numAgents, worldSize, initialDistribution } = params;
    const centers = Array.from({ length: random.int(3, 4) }, () => random());
    const agents: OpinionAgent[] = Array.from({ length: numAgents }, () => ({
      x: random() * worldSize,
      y: random() * worldSize,
      opinion: initialOpinion(initialDistribution, centers, random),
    }));
    return { agents, worldSize, ...aggregate(agents) };
  },

  step: ({ data, params, random }) => {
    const {
      interactionRadius,
      tolerance,
      influenceStrength,
      noise,
      worldSize,
    } = params;
    const agents = data.agents;
    const r2 = interactionRadius * interactionRadius;

    const nextOpinions = new Float64Array(agents.length);
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      let sum = 0;
      let count = 0;
      for (let j = 0; j < agents.length; j++) {
        const b = agents[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy > r2) continue;
        if (Math.abs(a.opinion - b.opinion) > tolerance) continue;
        sum += b.opinion;
        count++;
      }
      // count includes self (distance 0, opinion diff 0).
      const target = count > 0 ? sum / count : a.opinion;
      let o = a.opinion + (target - a.opinion) * influenceStrength;
      o += (random() - 0.5) * 2 * noise;
      nextOpinions[i] = clamp01(o);
    }

    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      a.opinion = nextOpinions[i];
      // Slow spatial drift so neighborhoods evolve.
      a.x = (a.x + (random() - 0.5) * 4 + worldSize) % worldSize;
      a.y = (a.y + (random() - 0.5) * 4 + worldSize) % worldSize;
    }

    return { ...data, agents, worldSize, ...aggregate(agents) };
  },
});
