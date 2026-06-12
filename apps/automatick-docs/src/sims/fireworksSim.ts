import { defineSim } from 'automatick/sim';
import type { SimRandom } from 'automatick/random';

export type FireworkParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // remaining lifetime, 0..1
  decay: number; // life lost per tick
  hue: number;
  size: number;
  type: 'spark' | 'trail' | 'burst';
};

export type Emitter = {
  x: number;
  y: number;
  cooldown: number;
};

export type FireworksData = {
  particles: FireworkParticle[];
  emitters: Emitter[];
  width: number;
  height: number;
};

export type FireworksParams = {
  gravity: number;
  drag: number;
  emitterCount: number;
  launchInterval: number;
  burstSize: number;
  sparkleChance: number;
  windStrength: number;
};

const MAX_PARTICLES = 2000;

function makeEmitters(
  count: number,
  width: number,
  height: number,
  random: SimRandom
): Emitter[] {
  const emitters: Emitter[] = [];
  for (let i = 0; i < count; i++) {
    const x = ((i + 1) / (count + 1)) * width;
    emitters.push({
      x,
      y: height,
      cooldown: random.int(0, 59),
    });
  }
  return emitters;
}

export default defineSim<FireworksData, FireworksParams>({
  defaultParams: {
    gravity: 0.06,
    drag: 0.01,
    emitterCount: 2,
    launchInterval: 45,
    burstSize: 90,
    sparkleChance: 0.04,
    windStrength: 0,
  },

  init: (params, { random }) => {
    const width = 600;
    const height = 600;
    return {
      particles: [],
      emitters: makeEmitters(params.emitterCount, width, height, random),
      width,
      height,
    };
  },

  step: ({ data, params, random }) => {
    const { gravity, drag, launchInterval, burstSize, sparkleChance, windStrength } =
      params;
    const { height } = data;
    const particles = data.particles;
    const dragFactor = 1 - drag;
    const newParticles: FireworkParticle[] = [];

    // Emitters launch rockets upward.
    for (const e of data.emitters) {
      e.cooldown -= 1;
      if (e.cooldown <= 0) {
        e.cooldown = launchInterval + Math.floor(random() * launchInterval);
        const speed = 7 + random() * 3;
        particles.push({
          x: e.x + (random() - 0.5) * 20,
          y: height,
          vx: (random() - 0.5) * 1.5,
          vy: -speed,
          life: 1,
          decay: 0.004,
          hue: random.int(0, 359),
          size: 2.5,
          type: 'spark',
        });
      }
    }

    // Update all particles.
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.vy += gravity;
      p.vx += windStrength;
      p.vx *= dragFactor;
      p.vy *= dragFactor;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.type === 'spark') {
        // Burst near apex (rising velocity becomes non-negative) or on timeout.
        if (p.vy >= -0.6 || p.life <= 0.2) {
          const count = burstSize;
          const baseHue = p.hue;
          for (let k = 0; k < count; k++) {
            const ang = (k / count) * Math.PI * 2 + random() * 0.3;
            const sp = 1.5 + random() * 3.5;
            newParticles.push({
              x: p.x,
              y: p.y,
              vx: Math.cos(ang) * sp,
              vy: Math.sin(ang) * sp,
              life: 1,
              decay: 0.012 + random() * 0.01,
              hue: baseHue + (random() - 0.5) * 40,
              size: 2,
              type: 'burst',
            });
          }
          p.life = 0; // remove the spent rocket
          continue;
        }
        // Smoke trail behind the rising rocket.
        if (newParticles.length + particles.length < MAX_PARTICLES) {
          newParticles.push({
            x: p.x,
            y: p.y,
            vx: (random() - 0.5) * 0.4,
            vy: (random() - 0.5) * 0.4,
            life: 0.6,
            decay: 0.04,
            hue: p.hue,
            size: 1.2,
            type: 'trail',
          });
        }
      } else if (p.type === 'burst') {
        // Occasional secondary sparkle.
        if (
          random() < sparkleChance &&
          newParticles.length + particles.length < MAX_PARTICLES
        ) {
          newParticles.push({
            x: p.x,
            y: p.y,
            vx: (random() - 0.5) * 1.2,
            vy: (random() - 0.5) * 1.2,
            life: 0.5,
            decay: 0.05,
            hue: p.hue,
            size: 1,
            type: 'trail',
          });
        }
      }
    }

    // Keep alive + in bounds, merge in new particles, cap total count.
    const alive: FireworkParticle[] = [];
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life > 0 && p.y < height + 20) alive.push(p);
    }
    for (let i = 0; i < newParticles.length; i++) {
      if (alive.length >= MAX_PARTICLES) break;
      alive.push(newParticles[i]);
    }

    data.particles = alive;
    return data;
  },
});
