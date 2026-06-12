import { defineSim } from 'automatick/sim';

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number;
};

export type ParticleLifeData = {
  particles: Particle[];
  /** numTypes × numTypes attraction matrix, flattened row-major. */
  matrix: number[];
  numTypes: number;
  worldSize: number;
};

export type ParticleLifeParams = {
  numParticles: number;
  numTypes: number;
  worldSize: number;
  friction: number;
  forceRange: number;
  forceStrength: number;
  randomizeForces: boolean;
};

/** Universal close-range repulsion radius as a fraction of forceRange. */
const REPEL_FRACTION = 0.3;

function makeMatrix(numTypes: number): number[] {
  const m: number[] = [];
  for (let i = 0; i < numTypes * numTypes; i++) {
    m.push(Math.random() * 2 - 1);
  }
  return m;
}

export default defineSim<ParticleLifeData, ParticleLifeParams>({
  defaultParams: {
    numParticles: 800,
    numTypes: 5,
    worldSize: 600,
    friction: 0.92,
    forceRange: 80,
    forceStrength: 1.5,
    randomizeForces: false,
  },

  init: (params) => {
    const { numParticles, numTypes, worldSize } = params;
    const particles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * worldSize,
        y: Math.random() * worldSize,
        vx: 0,
        vy: 0,
        type: Math.floor(Math.random() * numTypes),
      });
    }
    return {
      particles,
      matrix: makeMatrix(numTypes),
      numTypes,
      worldSize,
    };
  },

  step: ({ data, params }) => {
    const { friction, forceRange, forceStrength } = params;
    const { matrix, numTypes, worldSize } = data;
    const particles = data.particles;
    const n = particles.length;
    const range = forceRange;
    const repelDist = range * REPEL_FRACTION;

    // Accumulate forces, then integrate (read positions from current state).
    const fx = new Float32Array(n);
    const fy = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const pi = particles[i];
      const ti = pi.type;
      for (let j = i + 1; j < n; j++) {
        const pj = particles[j];
        let dx = pj.x - pi.x;
        let dy = pj.y - pi.y;
        // Toroidal shortest-path distance.
        if (dx > worldSize * 0.5) dx -= worldSize;
        else if (dx < -worldSize * 0.5) dx += worldSize;
        if (dy > worldSize * 0.5) dy -= worldSize;
        else if (dy < -worldSize * 0.5) dy += worldSize;

        const dist2 = dx * dx + dy * dy;
        if (dist2 >= range * range || dist2 === 0) continue;
        const dist = Math.sqrt(dist2);
        const ux = dx / dist;
        const uy = dy / dist;

        // Force profile: strong universal repulsion close in, then an
        // attraction/repulsion ramp keyed on the matrix value.
        let fi: number; // force on i from j (positive = toward j)
        let fj: number; // force on j from i (positive = toward i)
        if (dist < repelDist) {
          const r = (dist / repelDist - 1); // -1..0, repulsive
          fi = r;
          fj = r;
        } else {
          const aij = matrix[ti * numTypes + pj.type];
          const aji = matrix[pj.type * numTypes + ti];
          // Triangle ramp peaking at the midpoint of the outer band.
          const t = (dist - repelDist) / (range - repelDist); // 0..1
          const ramp = 1 - Math.abs(2 * t - 1);
          fi = aij * ramp;
          fj = aji * ramp;
        }

        fx[i] += ux * fi;
        fy[i] += uy * fi;
        fx[j] -= ux * fj;
        fy[j] -= uy * fj;
      }
    }

    for (let i = 0; i < n; i++) {
      const p = particles[i];
      p.vx = (p.vx + fx[i] * forceStrength) * friction;
      p.vy = (p.vy + fy[i] * forceStrength) * friction;
      p.x += p.vx;
      p.y += p.vy;
      // Wrap (toroidal).
      if (p.x < 0) p.x += worldSize;
      else if (p.x >= worldSize) p.x -= worldSize;
      if (p.y < 0) p.y += worldSize;
      else if (p.y >= worldSize) p.y -= worldSize;
    }

    return data;
  },
});
