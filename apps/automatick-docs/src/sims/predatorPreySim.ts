import { defineSim } from 'automatick/sim';

export type PredatorPreyAgent = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'prey' | 'predator';
  energy: number;
};

export type PredatorPreyData = {
  agents: PredatorPreyAgent[];
  preyCount: number;
  predatorCount: number;
};

export type PredatorPreyParams = {
  initialPrey: number;
  initialPredators: number;
  worldWidth: number;
  worldHeight: number;
  /** Per-tick probability a prey spawns offspring (scaled down by crowding). */
  preyReproduceChance: number;
  /** Soft cap: prey reproduction tapers to zero as the population nears this. */
  preyCarryingCapacity: number;
  preySpeed: number;
  predatorSpeed: number;
  /** Distance at which a predator notices and steers toward prey. */
  predatorHuntRadius: number;
  /** Energy a predator gains from eating one prey. */
  predatorEnergyGain: number;
  /** Energy a predator burns each tick (starves at zero). */
  predatorEnergyLoss: number;
  /** Energy threshold above which a predator splits into two. */
  predatorReproduceEnergy: number;
};

export const PREY_RADIUS = 2.5;
export const PREDATOR_RADIUS = 4;
const CATCH_DISTANCE = 6;
const PREDATOR_START_ENERGY = 30;

function wrap(v: number, max: number): number {
  if (v < 0) return v + max;
  if (v >= max) return v - max;
  return v;
}

function makePrey(
  x: number,
  y: number,
  speed: number,
  random: () => number
): PredatorPreyAgent {
  const angle = random() * Math.PI * 2;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    type: 'prey',
    energy: 1,
  };
}

function makePredator(
  x: number,
  y: number,
  speed: number,
  energy: number,
  random: () => number
): PredatorPreyAgent {
  const angle = random() * Math.PI * 2;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    type: 'predator',
    energy,
  };
}

export default defineSim<PredatorPreyData, PredatorPreyParams>({
  defaultParams: {
    initialPrey: 250,
    initialPredators: 25,
    worldWidth: 600,
    worldHeight: 600,
    preyReproduceChance: 0.04,
    preyCarryingCapacity: 700,
    preySpeed: 1.5,
    predatorSpeed: 2.4,
    predatorHuntRadius: 70,
    predatorEnergyGain: 14,
    predatorEnergyLoss: 0.45,
    predatorReproduceEnergy: 55,
  },

  init: (params, { random }) => {
    const {
      initialPrey,
      initialPredators,
      worldWidth,
      worldHeight,
      preySpeed,
      predatorSpeed,
    } = params;
    const agents: PredatorPreyAgent[] = [];

    for (let i = 0; i < initialPrey; i++) {
      agents.push(
        makePrey(
          random() * worldWidth,
          random() * worldHeight,
          preySpeed,
          random
        )
      );
    }
    for (let i = 0; i < initialPredators; i++) {
      // Desynchronize starting energy so predators don't all starve at once.
      const energy = PREDATOR_START_ENERGY * (0.6 + random() * 0.8);
      agents.push(
        makePredator(
          random() * worldWidth,
          random() * worldHeight,
          predatorSpeed,
          energy,
          random
        )
      );
    }

    return {
      agents,
      preyCount: initialPrey,
      predatorCount: initialPredators,
    };
  },

  step: ({ data, params, random }) => {
    const {
      worldWidth: W,
      worldHeight: H,
      preyReproduceChance,
      preyCarryingCapacity,
      preySpeed,
      predatorSpeed,
      predatorHuntRadius,
      predatorEnergyGain,
      predatorEnergyLoss,
      predatorReproduceEnergy,
    } = params;

    const prey: PredatorPreyAgent[] = [];
    const predators: PredatorPreyAgent[] = [];
    for (const a of data.agents) {
      if (a.type === 'prey') prey.push(a);
      else predators.push(a);
    }

    const eaten = new Array<boolean>(prey.length).fill(false);
    const huntR2 = predatorHuntRadius * predatorHuntRadius;
    const catchR2 = CATCH_DISTANCE * CATCH_DISTANCE;

    // --- Predators hunt, eat, move, reproduce or starve ---
    const nextPredators: PredatorPreyAgent[] = [];
    for (const pred of predators) {
      let nearest = -1;
      let nearestD2 = Infinity;
      for (let i = 0; i < prey.length; i++) {
        if (eaten[i]) continue;
        const dx = prey[i].x - pred.x;
        const dy = prey[i].y - pred.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < nearestD2) {
          nearestD2 = d2;
          nearest = i;
        }
      }

      if (nearest >= 0 && nearestD2 <= catchR2) {
        // Catch the prey.
        eaten[nearest] = true;
        pred.energy += predatorEnergyGain;
      } else if (nearest >= 0 && nearestD2 <= huntR2) {
        // Steer toward the nearest prey in range.
        const target = prey[nearest];
        const d = Math.sqrt(nearestD2) || 1;
        pred.vx = ((target.x - pred.x) / d) * predatorSpeed;
        pred.vy = ((target.y - pred.y) / d) * predatorSpeed;
      } else {
        // Wander: nudge heading and keep moving.
        const angle =
          Math.atan2(pred.vy, pred.vx) + (random() - 0.5) * 0.8;
        pred.vx = Math.cos(angle) * predatorSpeed;
        pred.vy = Math.sin(angle) * predatorSpeed;
      }

      pred.x = wrap(pred.x + pred.vx, W);
      pred.y = wrap(pred.y + pred.vy, H);
      pred.energy -= predatorEnergyLoss;

      if (pred.energy <= 0) continue; // starves

      if (pred.energy >= predatorReproduceEnergy) {
        pred.energy /= 2;
        nextPredators.push(
          makePredator(pred.x, pred.y, predatorSpeed, pred.energy, random)
        );
      }
      nextPredators.push(pred);
    }

    // --- Prey wander, then reproduce (logistic, slowed by crowding) ---
    const livePrey = prey.length - eaten.filter(Boolean).length;
    const crowding = Math.max(0, 1 - livePrey / preyCarryingCapacity);
    const effChance = preyReproduceChance * crowding;

    const nextPrey: PredatorPreyAgent[] = [];
    for (let i = 0; i < prey.length; i++) {
      if (eaten[i]) continue;
      const p = prey[i];
      const angle = Math.atan2(p.vy, p.vx) + (random() - 0.5) * 1.0;
      p.vx = Math.cos(angle) * preySpeed;
      p.vy = Math.sin(angle) * preySpeed;
      p.x = wrap(p.x + p.vx, W);
      p.y = wrap(p.y + p.vy, H);
      nextPrey.push(p);

      if (random() < effChance) {
        nextPrey.push(makePrey(p.x, p.y, preySpeed, random));
      }
    }

    return {
      agents: [...nextPrey, ...nextPredators],
      preyCount: nextPrey.length,
      predatorCount: nextPredators.length,
    };
  },
});
