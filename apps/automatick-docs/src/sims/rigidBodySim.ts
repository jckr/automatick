import { defineSim } from 'automatick/sim';

export type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  hue: number;
};

export type RigidBodyData = {
  bodies: Body[];
  width: number;
  height: number;
  collisions: number;
};

export type RigidBodyParams = {
  gravity: number;
  restitution: number;
  count: number;
  drop: boolean;
  width: number;
  height: number;
};

const SUBSTEPS = 4;
const MAX_SPEED = 18;
const WALL_DAMP = 0.98;

function makeBody(width: number, height: number): Body {
  const radius = 10 + Math.random() * 14;
  return {
    x: width * 0.2 + Math.random() * width * 0.6,
    y: radius + Math.random() * height * 0.4,
    vx: (Math.random() - 0.5) * 2,
    vy: 0,
    radius,
    mass: radius * radius,
    hue: Math.floor(Math.random() * 360),
  };
}

export default defineSim<RigidBodyData, RigidBodyParams>({
  defaultParams: {
    gravity: 0.5,
    restitution: 0.4,
    count: 28,
    drop: false,
    width: 600,
    height: 600,
  },

  init: ({ count, width, height }) => {
    const bodies: Body[] = [];
    for (let i = 0; i < count; i++) bodies.push(makeBody(width, height));
    return { bodies, width, height, collisions: 0 };
  },

  step: ({ data, params }) => {
    const { gravity, restitution, width, height, drop } = params;
    const bodies = data.bodies.map((b) => ({ ...b }));
    let collisions = data.collisions;

    // Optional continuous spawn from the top while "drop" is on.
    if (drop && bodies.length < 120) {
      const b = makeBody(width, height);
      b.y = b.radius + 2;
      bodies.push(b);
    }

    const g = gravity / SUBSTEPS;

    for (let s = 0; s < SUBSTEPS; s++) {
      // Integrate gravity + position.
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        b.vy += g;
        // Clamp velocity to keep the system stable.
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > MAX_SPEED) {
          const k = MAX_SPEED / sp;
          b.vx *= k;
          b.vy *= k;
        }
        b.x += b.vx / SUBSTEPS;
        b.y += b.vy / SUBSTEPS;
      }

      // Body-body collisions: detect, resolve overlap, apply impulse.
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const minDist = a.radius + b.radius;
          const dist2 = dx * dx + dy * dy;
          if (dist2 >= minDist * minDist || dist2 === 0) continue;

          const dist = Math.sqrt(dist2);
          const nx = dx / dist;
          const ny = dy / dist;

          // Positional correction: push apart proportional to inverse mass.
          const overlap = minDist - dist;
          const invA = 1 / a.mass;
          const invB = 1 / b.mass;
          const totalInv = invA + invB;
          const corr = overlap / totalInv;
          a.x -= nx * corr * invA;
          a.y -= ny * corr * invA;
          b.x += nx * corr * invB;
          b.y += ny * corr * invB;

          // Impulse response along the normal.
          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;
          if (velAlongNormal > 0) continue; // already separating

          const e = restitution;
          const impulse = (-(1 + e) * velAlongNormal) / totalInv;
          const ix = impulse * nx;
          const iy = impulse * ny;
          a.vx -= ix * invA;
          a.vy -= iy * invA;
          b.vx += ix * invB;
          b.vy += iy * invB;
          collisions++;
        }
      }

      // Floor and walls.
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (b.x < b.radius) {
          b.x = b.radius;
          b.vx = Math.abs(b.vx) * restitution * WALL_DAMP;
        } else if (b.x > width - b.radius) {
          b.x = width - b.radius;
          b.vx = -Math.abs(b.vx) * restitution * WALL_DAMP;
        }
        if (b.y > height - b.radius) {
          b.y = height - b.radius;
          b.vy = -Math.abs(b.vy) * restitution * WALL_DAMP;
          b.vx *= 0.99; // ground friction
        } else if (b.y < b.radius) {
          b.y = b.radius;
          b.vy = Math.abs(b.vy) * restitution * WALL_DAMP;
        }
      }
    }

    return { bodies, width, height, collisions };
  },
});
