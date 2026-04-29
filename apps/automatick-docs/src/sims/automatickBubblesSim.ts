import { defineSim } from 'automatick/sim';
import { getLetterMask, isInsideMask } from './automatickHeroMask';

/**
 * Bubbles flow left to right across the canvas. When a bubble's center is
 * inside the rasterized "automatick" wordmark, it slows to a minimum speed
 * factor (never zero) and gets tinted. When a bubble exits stage right, it
 * respawns at stage left with fresh state.
 *
 * The wordmark is never drawn explicitly — it's inferred by the viewer
 * from (a) the higher bubble density inside the letters, caused by the
 * slowdown + conservation-of-flow, and (b) the per-bubble color tint
 * applied while inside.
 *
 * The mask itself lives in `automatickHeroMask.ts` — module-level static,
 * not in `Data`. Per the viz-first discipline.
 */

export type Bubble = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Per-bubble metaball strength (proxy for size in the future field render). */
  r: number;
  /** Per-bubble color hue in [0, 1]. Renderer maps this through a small palette
   *  for outside-mask bubbles. Fixed at spawn so each bubble's identity persists. */
  hue: number;
};

export type BubblesData = {
  bubbles: Bubble[];
};

export type BubblesParams = {
  width: number;
  height: number;
  /** Total bubbles in flight at any time. */
  nbBubbles: number;
  /** Average rightward speed when outside the wordmark, in px/tick. */
  baseSpeed: number;
  /** Speed multiplier applied while a bubble's center is inside the letter mask. 0 < min < 1. */
  minSpeedFactor: number;
  /** Magnitude of vertical wobble applied each tick. */
  vyJitter: number;
  /** Mean blob radius / metaball strength. */
  blobSize: number;
  /** Variance in radius around `blobSize` (0 = all identical). */
  blobSizeVariance: number;
  text: string;
  /** Per-frame fade-toward-bg alpha. Lower values = longer-lasting trails. */
  trailFade: number;
  /** Composite mode used to draw outside-mask bubble trails onto the canvas.
   *  In-mask (wordmark) bubbles always composite with `source-over` on top. */
  outsideBlendMode:
    | 'source-over'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'soft-light'
    | 'hard-light'
    | 'difference'
    | 'exclusion'
    | 'color-dodge'
    | 'color-burn'
    | 'hue'
    | 'color'
    | 'lighter';
  /** When true, paint a faint outline of the letter shape behind everything (debug). */
  showMask: boolean;
};

const DEFAULT_PARAMS: BubblesParams = {
  width: 1200,
  height: 380,
  nbBubbles: 1500,
  baseSpeed: 1.6,
  minSpeedFactor: 0.18,
  vyJitter: 0.04,
  blobSize: 11,
  blobSizeVariance: 0.45,
  text: 'automatick',
  trailFade: 0.06,
  outsideBlendMode: 'screen',
  showMask: false,
};

/** Maximum half-angle from horizontal at spawn, in radians. ±45°. */
const SPAWN_HALF_ANGLE = Math.PI / 4;

/** Maximum |vy| as a fraction of |vx| at any tick. Caps the steepest drift
 *  to ~17° from horizontal so the flow always reads as left-to-right. */
const VY_CAP_RATIO = 0.3;

/** Per-tick velocity damping toward 0 to prevent random-walk drift over
 *  long bubble lifetimes. 0.97 = decays vy halfway in ~22 ticks. */
const VY_DAMPING = 0.97;

function spawnFresh(params: BubblesParams, atLeftEdge: boolean): Bubble {
  const { width, height, baseSpeed, blobSize, blobSizeVariance } = params;
  const sizeR = blobSize * (1 + (Math.random() - 0.5) * 2 * blobSizeVariance);
  const speed = baseSpeed * (0.85 + Math.random() * 0.3);
  const angle = (Math.random() - 0.5) * 2 * SPAWN_HALF_ANGLE;
  return {
    x: atLeftEdge ? -sizeR - Math.random() * 20 : Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: Math.max(8, sizeR),
    hue: Math.random(),
  };
}

export default defineSim<BubblesData, BubblesParams>({
  defaultParams: DEFAULT_PARAMS,
  init: (params) => {
    const bubbles: Bubble[] = new Array(params.nbBubbles);
    for (let i = 0; i < params.nbBubbles; i++) {
      bubbles[i] = spawnFresh(params, false);
    }
    return { bubbles };
  },
  step: ({ data, params }) => {
    const { width, height, minSpeedFactor, vyJitter, text } = params;
    const mask = getLetterMask(text, width, height);
    const N = data.bubbles.length;

    const bubbles: Bubble[] = new Array(N);
    for (let i = 0; i < N; i++) {
      const b = data.bubbles[i];
      const inside = isInsideMask(mask, b.x, b.y);
      const speedMult = inside ? minSpeedFactor : 1;

      // Vertical wobble: small random kick, damped, and clamped to a
      // fraction of vx so drift never exceeds a small angle from
      // horizontal. No center-pull — direction is independent of y so
      // top-spawned bubbles travel along the top, bottom-spawned along
      // the bottom, instead of all converging toward the middle.
      const vyKick = (Math.random() - 0.5) * vyJitter;
      let vy = b.vy * VY_DAMPING + vyKick;
      const vyCap = Math.abs(b.vx) * VY_CAP_RATIO;
      if (vy > vyCap) vy = vyCap;
      else if (vy < -vyCap) vy = -vyCap;

      const x = b.x + b.vx * speedMult;
      const y = b.y + vy * speedMult;

      // Respawn at stage left when fully off the right edge (account for
      // blob radius so the disappearance is symmetric with how it appears).
      if (x - b.r > width) {
        bubbles[i] = spawnFresh(params, true);
        continue;
      }

      // Soft vertical containment — wrap is jarring with directional
      // flow, so clamp instead and reflect the velocity.
      let yc = y;
      let vyc = vy;
      if (yc < 0) {
        yc = 0;
        vyc = Math.abs(vyc);
      } else if (yc > height) {
        yc = height;
        vyc = -Math.abs(vyc);
      }

      bubbles[i] = {
        x,
        y: yc,
        vx: b.vx,
        vy: vyc,
        r: b.r,
        hue: b.hue,
      };
    }

    return { bubbles };
  },
});
