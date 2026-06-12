import { defineSim } from 'automatick/sim';

export type Pendulum = {
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
  hue: number;
  /** Ring buffer of recent tip positions: [x0, y0, x1, y1, ...]. */
  trail: Float32Array;
  /** Index of the next slot to write in the ring buffer. */
  trailHead: number;
  /** Number of valid points currently stored (<= trail capacity). */
  trailCount: number;
};

export type DoublePendulumData = {
  pendulums: Pendulum[];
};

export type DoublePendulumParams = {
  m1: number;
  m2: number;
  L1: number;
  L2: number;
  gravity: number;
  damping: number;
  dt: number;
  subSteps: number;
  trailLength: number;
  initialTheta1: number;
  initialTheta2: number;
  chips: number;
};

const PALETTE = [200, 30, 130, 320, 90];

type Accel = { a1: number; a2: number };

function accelerations(
  theta1: number,
  theta2: number,
  omega1: number,
  omega2: number,
  m1: number,
  m2: number,
  L1: number,
  L2: number,
  g: number
): Accel {
  const delta = theta1 - theta2;
  const denom = 2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2);

  const a1 =
    (-g * (2 * m1 + m2) * Math.sin(theta1) -
      m2 * g * Math.sin(theta1 - 2 * theta2) -
      2 *
        Math.sin(delta) *
        m2 *
        (omega2 * omega2 * L2 + omega1 * omega1 * L1 * Math.cos(delta))) /
    (L1 * denom);

  const a2 =
    (2 *
      Math.sin(delta) *
      (omega1 * omega1 * L1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(theta1) +
        omega2 * omega2 * L2 * m2 * Math.cos(delta))) /
    (L2 * denom);

  return { a1, a2 };
}

function makePendulum(params: DoublePendulumParams, index: number): Pendulum {
  const toRad = Math.PI / 180;
  // Spread the chips by a tiny angle to dramatize chaotic divergence.
  const jitter = index * 0.5 * toRad;
  const capacity = Math.max(2, Math.floor(params.trailLength));
  return {
    theta1: params.initialTheta1 * toRad + jitter,
    theta2: params.initialTheta2 * toRad + jitter,
    omega1: 0,
    omega2: 0,
    hue: PALETTE[index % PALETTE.length],
    trail: new Float32Array(capacity * 2),
    trailHead: 0,
    trailCount: 0,
  };
}

export default defineSim<DoublePendulumData, DoublePendulumParams>({
  defaultParams: {
    m1: 2,
    m2: 2,
    L1: 130,
    L2: 130,
    gravity: 1,
    damping: 1,
    dt: 0.08,
    subSteps: 8,
    trailLength: 260,
    initialTheta1: 95,
    initialTheta2: 95,
    chips: 1,
  },

  init: (params) => {
    const n = Math.max(1, Math.floor(params.chips));
    const pendulums: Pendulum[] = [];
    for (let i = 0; i < n; i++) pendulums.push(makePendulum(params, i));
    return { pendulums };
  },

  step: ({ data, params }) => {
    const { m1, m2, L1, L2, gravity, damping, dt, subSteps } = params;
    const steps = Math.max(1, Math.floor(subSteps));
    const capacity = data.pendulums.length
      ? data.pendulums[0].trail.length / 2
      : 0;

    for (let p = 0; p < data.pendulums.length; p++) {
      const pen = data.pendulums[p];
      let { theta1, theta2, omega1, omega2 } = pen;

      for (let s = 0; s < steps; s++) {
        // RK4 integration over the 4-dim state [theta1, theta2, omega1, omega2].
        const deriv = (
          t1: number,
          t2: number,
          o1: number,
          o2: number
        ) => {
          const { a1, a2 } = accelerations(
            t1,
            t2,
            o1,
            o2,
            m1,
            m2,
            L1,
            L2,
            gravity
          );
          return { dt1: o1, dt2: o2, do1: a1, do2: a2 };
        };

        const k1 = deriv(theta1, theta2, omega1, omega2);
        const k2 = deriv(
          theta1 + (k1.dt1 * dt) / 2,
          theta2 + (k1.dt2 * dt) / 2,
          omega1 + (k1.do1 * dt) / 2,
          omega2 + (k1.do2 * dt) / 2
        );
        const k3 = deriv(
          theta1 + (k2.dt1 * dt) / 2,
          theta2 + (k2.dt2 * dt) / 2,
          omega1 + (k2.do1 * dt) / 2,
          omega2 + (k2.do2 * dt) / 2
        );
        const k4 = deriv(
          theta1 + k3.dt1 * dt,
          theta2 + k3.dt2 * dt,
          omega1 + k3.do1 * dt,
          omega2 + k3.do2 * dt
        );

        theta1 += (dt / 6) * (k1.dt1 + 2 * k2.dt1 + 2 * k3.dt1 + k4.dt1);
        theta2 += (dt / 6) * (k1.dt2 + 2 * k2.dt2 + 2 * k3.dt2 + k4.dt2);
        omega1 += (dt / 6) * (k1.do1 + 2 * k2.do1 + 2 * k3.do1 + k4.do1);
        omega2 += (dt / 6) * (k1.do2 + 2 * k2.do2 + 2 * k3.do2 + k4.do2);

        omega1 *= damping;
        omega2 *= damping;
      }

      pen.theta1 = theta1;
      pen.theta2 = theta2;
      pen.omega1 = omega1;
      pen.omega2 = omega2;

      // Record the tip position in the ring buffer (sim-space, pivot at origin).
      if (capacity > 0) {
        const x1 = L1 * Math.sin(theta1);
        const y1 = L1 * Math.cos(theta1);
        const x2 = x1 + L2 * Math.sin(theta2);
        const y2 = y1 + L2 * Math.cos(theta2);
        const slot = pen.trailHead * 2;
        pen.trail[slot] = x2;
        pen.trail[slot + 1] = y2;
        pen.trailHead = (pen.trailHead + 1) % capacity;
        if (pen.trailCount < capacity) pen.trailCount++;
      }
    }

    return data;
  },
});
