import { defineSim } from 'automatick/sim';

export type EMCharge = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Signed charge: positive or negative, magnitude varies. */
  charge: number;
  mass: number;
  fixed: boolean;
};

export type EMFieldData = {
  charges: EMCharge[];
  /** Electric potential sampled on a res×res grid (row-major), for the heatmap. */
  potential: Float32Array;
  res: number;
  width: number;
  height: number;
};

export type EMFieldParams = {
  numPositive: number;
  numNegative: number;
  coulombStrength: number;
  damping: number;
  fixedCharges: boolean;
  showFieldLines: boolean;
  showPotential: boolean;
  fieldResolution: number;
  width: number;
  height: number;
};

export const EM_WIDTH = 600;
export const EM_HEIGHT = 600;

const SOFTENING = 16; // avoids singular forces as r → 0
const DT = 0.6;
const MAX_ACCEL = 2.5;
const MAX_SPEED = 6;
const RESTITUTION = 0.9;
const WALL_MARGIN = 8;
const POT_SOFTEN = 9;

function makeCharge(
  width: number,
  height: number,
  sign: number,
  random: () => number
): EMCharge {
  const mag = 1 + random() * 1.5;
  return {
    x: width * (0.15 + random() * 0.7),
    y: height * (0.15 + random() * 0.7),
    vx: 0,
    vy: 0,
    charge: sign * mag,
    mass: mag,
    fixed: false,
  };
}

/** Add or remove charges of a given sign so the count matches `target`. */
function reconcile(
  charges: EMCharge[],
  sign: number,
  target: number,
  width: number,
  height: number,
  random: () => number
): void {
  let count = charges.reduce((n, c) => n + (Math.sign(c.charge) === sign ? 1 : 0), 0);
  while (count < target) {
    charges.push(makeCharge(width, height, sign, random));
    count++;
  }
  while (count > target) {
    for (let i = charges.length - 1; i >= 0; i--) {
      if (Math.sign(charges[i].charge) === sign) {
        charges.splice(i, 1);
        break;
      }
    }
    count--;
  }
}

/** Sample electric potential (Σ q/r) onto the coarse grid for the heatmap. */
function computePotential(
  charges: EMCharge[],
  pot: Float32Array,
  res: number,
  width: number,
  height: number
): void {
  const cw = width / res;
  const ch = height / res;
  const soft2 = POT_SOFTEN * POT_SOFTEN;
  for (let gy = 0; gy < res; gy++) {
    const py = (gy + 0.5) * ch;
    for (let gx = 0; gx < res; gx++) {
      const px = (gx + 0.5) * cw;
      let v = 0;
      for (const c of charges) {
        const dx = px - c.x;
        const dy = py - c.y;
        v += c.charge / Math.sqrt(dx * dx + dy * dy + soft2);
      }
      pot[gy * res + gx] = v;
    }
  }
}

export default defineSim<EMFieldData, EMFieldParams>({
  defaultParams: {
    numPositive: 4,
    numNegative: 4,
    coulombStrength: 1600,
    damping: 0.997,
    fixedCharges: true,
    showFieldLines: true,
    showPotential: true,
    fieldResolution: 64,
    width: EM_WIDTH,
    height: EM_HEIGHT,
  },

  init: (params, { random }) => {
    const { numPositive, numNegative, fieldResolution, width, height } = params;
    const charges: EMCharge[] = [];
    for (let i = 0; i < numPositive; i++) charges.push(makeCharge(width, height, 1, random));
    for (let i = 0; i < numNegative; i++) charges.push(makeCharge(width, height, -1, random));
    const res = fieldResolution;
    const potential = new Float32Array(res * res);
    computePotential(charges, potential, res, width, height);
    return { charges, potential, res, width, height };
  },

  step: ({ data, params, random }) => {
    const {
      coulombStrength: k,
      damping,
      fixedCharges,
      showPotential,
      numPositive,
      numNegative,
      width,
      height,
    } = params;
    const charges = data.charges;

    // Live-reconcile counts so the sliders take effect without a reset.
    reconcile(charges, 1, numPositive, width, height, random);
    reconcile(charges, -1, numNegative, width, height, random);

    if (!fixedCharges) {
      const n = charges.length;
      const axs = new Float64Array(n);
      const ays = new Float64Array(n);

      // Phase 1: accumulate Coulomb acceleration from start-of-tick positions.
      for (let i = 0; i < n; i++) {
        const ci = charges[i];
        let ax = 0;
        let ay = 0;
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const cj = charges[j];
          const dx = ci.x - cj.x;
          const dy = ci.y - cj.y;
          const rsoft2 = dx * dx + dy * dy + SOFTENING * SOFTENING;
          const inv3 = 1 / (rsoft2 * Math.sqrt(rsoft2));
          // Sign of (qi·qj) makes like charges repel and opposites attract.
          const f = (k * ci.charge * cj.charge) * inv3;
          ax += f * dx;
          ay += f * dy;
        }
        ax /= ci.mass;
        ay /= ci.mass;
        const am = Math.hypot(ax, ay);
        if (am > MAX_ACCEL) {
          ax = (ax / am) * MAX_ACCEL;
          ay = (ay / am) * MAX_ACCEL;
        }
        axs[i] = ax;
        ays[i] = ay;
      }

      // Phase 2: integrate velocity/position and bounce off the walls.
      for (let i = 0; i < n; i++) {
        const ci = charges[i];
        ci.vx = (ci.vx + axs[i] * DT) * damping;
        ci.vy = (ci.vy + ays[i] * DT) * damping;
        const sm = Math.hypot(ci.vx, ci.vy);
        if (sm > MAX_SPEED) {
          ci.vx = (ci.vx / sm) * MAX_SPEED;
          ci.vy = (ci.vy / sm) * MAX_SPEED;
        }
        ci.x += ci.vx * DT;
        ci.y += ci.vy * DT;
        if (ci.x < WALL_MARGIN) {
          ci.x = WALL_MARGIN;
          ci.vx = Math.abs(ci.vx) * RESTITUTION;
        } else if (ci.x > width - WALL_MARGIN) {
          ci.x = width - WALL_MARGIN;
          ci.vx = -Math.abs(ci.vx) * RESTITUTION;
        }
        if (ci.y < WALL_MARGIN) {
          ci.y = WALL_MARGIN;
          ci.vy = Math.abs(ci.vy) * RESTITUTION;
        } else if (ci.y > height - WALL_MARGIN) {
          ci.y = height - WALL_MARGIN;
          ci.vy = -Math.abs(ci.vy) * RESTITUTION;
        }
      }
    }

    if (showPotential) {
      computePotential(charges, data.potential, data.res, width, height);
    }

    return data;
  },
});
