import { defineSim } from 'automatick/sim';

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  generation: number;
};

export type GravityData = {
  particles: Particle[];
};

export type GravityParams = {
  count: number;
  G: number;
  damping: number;
  width: number;
  height: number;
  softening: number;
  dt: number;
};

export default defineSim<GravityData, GravityParams>({
  defaultParams: {
    count: 200,
    G: 0.5,
    damping: 0.999,
    width: 600,
    height: 400,
    softening: 5,
    dt: 0.5,
  },

  init: ({ count, width, height }) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const mass = 1 + Math.random() * 4;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        mass,
        radius: Math.sqrt(mass) * 1.5,
        generation: 0,
      });
    }
    return { particles };
  },

  step: ({ data, params }) => {
    const { G, damping, width, height, softening, dt } = params;
    const n = data.particles.length;
    const soft2 = softening * softening;

    // Copy particles for mutation
    const particles: Particle[] = data.particles.map((p) => ({ ...p }));

    // O(n²) pairwise gravitational force
    for (let i = 0; i < n; i++) {
      let ax = 0;
      let ay = 0;
      const pi = particles[i];

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const pj = particles[j];
        const dx = pj.x - pi.x;
        const dy = pj.y - pi.y;
        const dist2 = dx * dx + dy * dy + soft2;
        const dist = Math.sqrt(dist2);
        const force = (G * pj.mass) / dist2;
        ax += force * (dx / dist);
        ay += force * (dy / dist);
      }

      pi.vx = (pi.vx + ax * dt) * damping;
      pi.vy = (pi.vy + ay * dt) * damping;
    }

    // Update positions and bounce off walls
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < p.radius) {
        p.x = p.radius;
        p.vx = Math.abs(p.vx) * 0.8;
      } else if (p.x > width - p.radius) {
        p.x = width - p.radius;
        p.vx = -Math.abs(p.vx) * 0.8;
      }

      if (p.y < p.radius) {
        p.y = p.radius;
        p.vy = Math.abs(p.vy) * 0.8;
      } else if (p.y > height - p.radius) {
        p.y = height - p.radius;
        p.vy = -Math.abs(p.vy) * 0.8;
      }
    }

    // Collision detection: touching particles are both destroyed & respawned
    const destroyed = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (destroyed[i]) continue;
      const pi = particles[i];
      for (let j = i + 1; j < n; j++) {
        if (destroyed[j]) continue;
        const pj = particles[j];
        const dx = pj.x - pi.x;
        const dy = pj.y - pi.y;
        const r = pi.radius + pj.radius;
        if (dx * dx + dy * dy <= r * r) {
          destroyed[i] = 1;
          destroyed[j] = 1;
          break;
        }
      }
    }

    for (let i = 0; i < n; i++) {
      if (!destroyed[i]) continue;
      const p = particles[i];
      const mass = 1 + Math.random() * 4;
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.vx = (Math.random() - 0.5) * 2;
      p.vy = (Math.random() - 0.5) * 2;
      p.mass = mass;
      p.radius = Math.sqrt(mass) * 1.5;
      p.generation += 1;
    }

    return { particles };
  },
});
