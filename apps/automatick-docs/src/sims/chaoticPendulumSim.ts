import { defineSim } from 'automatick/sim';

/**
 * A chaotic pendulum: a chain of any number of point masses linked by rigid,
 * massless arms. Two nodes is the classic double pendulum; add more and the
 * motion grows richer (and more violently chaotic). The chain length, per-arm
 * length and per-node mass are all live-editable via params — the running
 * state (angles, velocities, trail) reconciles to the new node count without a
 * reset, so you can grow or trim the chain mid-swing.
 */

/** Live state of one pendulum chain (one entry per spawned copy / "chip"). */
export type Pendulum = {
  /** Angle of each arm from vertical (radians). One per node. */
  theta: number[];
  /** Angular velocity of each arm (radians / unit time). One per node. */
  omega: number[];
  hue: number;
  /** Ring buffer of recent tip positions: [x0, y0, x1, y1, ...]. */
  trail: Float32Array;
  /** Index of the next slot to write in the ring buffer. */
  trailHead: number;
  /** Number of valid points currently stored (<= trail capacity). */
  trailCount: number;
};

export type ChaoticPendulumData = {
  pendulums: Pendulum[];
};

export type ChaoticPendulumParams = {
  /** Arm lengths, one per node — its length is the node count. */
  lengths: number[];
  /** Node (bob) masses, one per node. Same length as `lengths`. */
  masses: number[];
  gravity: number;
  damping: number;
  dt: number;
  subSteps: number;
  /**
   * How many of the most-recent tip positions to draw. The ring buffer is
   * allocated once at MAX_TRAIL capacity, so this is a pure render knob —
   * tweaking it is instant and never resets the run.
   */
  trailLength: number;
  /** Starting angle of the first arm (degrees). */
  initialAngle: number;
  /** Extra angle added per node down the chain (degrees), to shape the start. */
  spread: number;
  /** Number of near-identical copies to spawn (chaos-divergence demo). */
  chips: number;
};

const PALETTE = [200, 30, 130, 320, 90];

/**
 * Fixed ring-buffer capacity for every trail. `trailLength` selects how many
 * of these points are drawn; keeping the buffer fixed means the trail-length
 * control never has to reallocate or reset the run.
 */
export const MAX_TRAIL = 1600;

/**
 * Angular accelerations for an N-arm pendulum chain, from the Lagrangian
 * equations of motion. Solves the linear system M·α = b where
 *   M[i][j] = L_i L_j cos(θ_i − θ_j) · S_max(i,j)
 *   b[i]    = −g L_i S_i sin(θ_i) − Σ_j L_i L_j S_max(i,j) sin(θ_i − θ_j) ω_j²
 * and S_k = Σ_{n≥k} m_n is the mass hanging at or below node k. For N=2 this
 * reduces exactly to the standard double-pendulum equations.
 */
function accelerations(
  theta: number[],
  omega: number[],
  lengths: number[],
  masses: number[],
  g: number
): number[] {
  const n = theta.length;

  // Suffix mass sums: S[i] = mass at or below node i.
  const S = new Array<number>(n);
  let running = 0;
  for (let i = n - 1; i >= 0; i--) {
    running += masses[i];
    S[i] = running;
  }

  // Assemble the mass matrix M and the forcing vector b.
  const M: number[][] = [];
  const b = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const row = new Array<number>(n);
    let bi = -g * lengths[i] * S[i] * Math.sin(theta[i]);
    for (let j = 0; j < n; j++) {
      const smax = S[Math.max(i, j)];
      const d = theta[i] - theta[j];
      row[j] = lengths[i] * lengths[j] * Math.cos(d) * smax;
      // The j === i term vanishes (sin 0 = 0), so no self-coupling.
      bi -= lengths[i] * lengths[j] * smax * Math.sin(d) * omega[j] * omega[j];
    }
    M.push(row);
    b[i] = bi;
  }

  return solveLinear(M, b);
}

/** Gaussian elimination with partial pivoting. Mutates M and b in place. */
function solveLinear(M: number[][], b: number[]): number[] {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (pivot !== col) {
      const tmpRow = M[pivot];
      M[pivot] = M[col];
      M[col] = tmpRow;
      const tmpB = b[pivot];
      b[pivot] = b[col];
      b[col] = tmpB;
    }
    const diag = M[col][col] || 1e-12;
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / diag;
      if (factor === 0) continue;
      for (let c = col; c < n; c++) M[r][c] -= factor * M[col][c];
      b[r] -= factor * b[col];
    }
  }

  const x = new Array<number>(n);
  for (let r = n - 1; r >= 0; r--) {
    let sum = b[r];
    for (let c = r + 1; c < n; c++) sum -= M[r][c] * x[c];
    x[r] = sum / (M[r][r] || 1e-12);
  }
  return x;
}

function makePendulum(params: ChaoticPendulumParams, index: number): Pendulum {
  const toRad = Math.PI / 180;
  // Spread the chips by a tiny angle to dramatize chaotic divergence.
  const jitter = index * 0.5 * toRad;
  const nodes = params.lengths.length;
  const theta: number[] = [];
  const omega: number[] = [];
  for (let i = 0; i < nodes; i++) {
    theta.push((params.initialAngle + i * params.spread) * toRad + jitter);
    omega.push(0);
  }
  return {
    theta,
    omega,
    hue: PALETTE[index % PALETTE.length],
    trail: new Float32Array(MAX_TRAIL * 2),
    trailHead: 0,
    trailCount: 0,
  };
}

/**
 * Grow or shrink a chain's live state to match the current node count. New
 * arms extend the chain in line with the last one (angle copied, at rest);
 * removed arms are popped off the end. Called every step so add/remove-node
 * edits apply without resetting the run.
 */
function reconcileNodes(pen: Pendulum, target: number) {
  while (pen.theta.length < target) {
    const last = pen.theta.length - 1;
    pen.theta.push(last >= 0 ? pen.theta[last] : 0);
    pen.omega.push(0);
  }
  while (pen.theta.length > target && pen.theta.length > 1) {
    pen.theta.pop();
    pen.omega.pop();
  }
}

export default defineSim<ChaoticPendulumData, ChaoticPendulumParams>({
  defaultParams: {
    lengths: [130, 130],
    masses: [2, 2],
    gravity: 1,
    damping: 1,
    dt: 0.08,
    subSteps: 8,
    trailLength: 600,
    initialAngle: 95,
    spread: 0,
    chips: 1,
  },

  init: (params) => {
    const n = Math.max(1, Math.floor(params.chips));
    const pendulums: Pendulum[] = [];
    for (let i = 0; i < n; i++) pendulums.push(makePendulum(params, i));
    return { pendulums };
  },

  step: ({ data, params }) => {
    const { lengths, masses, gravity, damping, dt, subSteps } = params;
    const nodes = lengths.length;
    const steps = Math.max(1, Math.floor(subSteps));

    for (const pen of data.pendulums) {
      // Absorb live add/remove-node edits before integrating.
      reconcileNodes(pen, nodes);
      const n = pen.theta.length;

      for (let s = 0; s < steps; s++) {
        // RK4 over the full state vector [θ_0..θ_{n-1}, ω_0..ω_{n-1}].
        const k1t = pen.omega.slice();
        const k1o = accelerations(pen.theta, pen.omega, lengths, masses, gravity);

        const t2 = pen.theta.map((v, i) => v + (k1t[i] * dt) / 2);
        const o2 = pen.omega.map((v, i) => v + (k1o[i] * dt) / 2);
        const k2t = o2.slice();
        const k2o = accelerations(t2, o2, lengths, masses, gravity);

        const t3 = pen.theta.map((v, i) => v + (k2t[i] * dt) / 2);
        const o3 = pen.omega.map((v, i) => v + (k2o[i] * dt) / 2);
        const k3t = o3.slice();
        const k3o = accelerations(t3, o3, lengths, masses, gravity);

        const t4 = pen.theta.map((v, i) => v + k3t[i] * dt);
        const o4 = pen.omega.map((v, i) => v + k3o[i] * dt);
        const k4t = o4.slice();
        const k4o = accelerations(t4, o4, lengths, masses, gravity);

        for (let i = 0; i < n; i++) {
          pen.theta[i] += (dt / 6) * (k1t[i] + 2 * k2t[i] + 2 * k3t[i] + k4t[i]);
          pen.omega[i] += (dt / 6) * (k1o[i] + 2 * k2o[i] + 2 * k3o[i] + k4o[i]);
          pen.omega[i] *= damping;
        }
      }

      // Record the tip (last node) position in the ring buffer.
      let x = 0;
      let y = 0;
      for (let i = 0; i < n; i++) {
        x += lengths[i] * Math.sin(pen.theta[i]);
        y += lengths[i] * Math.cos(pen.theta[i]);
      }
      const slot = pen.trailHead * 2;
      pen.trail[slot] = x;
      pen.trail[slot + 1] = y;
      pen.trailHead = (pen.trailHead + 1) % MAX_TRAIL;
      if (pen.trailCount < MAX_TRAIL) pen.trailCount++;
    }

    return data;
  },
});
