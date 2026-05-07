import { defineSim } from 'automatick/sim';
import { PULSE_ANCHORS } from './worldSpinnerData';

/**
 * Visualization-first sim. The static dataset (the dots) lives in
 * worldSpinnerData.ts as a module-level constant. Only the things that
 * change every tick — the camera angle and the active pulses — go in `Data`.
 */

export type Pulse = {
  /** Index into PULSE_ANCHORS. */
  anchor: number;
  /** Tick when this pulse spawned. */
  bornTick: number;
};

export type WorldSpinnerData = {
  angle: number;
  pulses: Pulse[];
};

export type WorldSpinnerParams = {
  /** Radians per tick. */
  angularSpeed: number;
  /** Probability per tick of spawning a new pulse. */
  pulseRate: number;
  /** How long a pulse stays alive, in ticks. */
  pulseLifetime: number;
  /** Visual scale of the dots. */
  dotSize: number;
};

const DEFAULT_PARAMS: WorldSpinnerParams = {
  angularSpeed: 0.005,
  pulseRate: 0.05,
  pulseLifetime: 60,
  dotSize: 0.02,
};

export default defineSim<WorldSpinnerData, WorldSpinnerParams>({
  defaultParams: DEFAULT_PARAMS,
  init: { angle: 0, pulses: [] },
  step: ({ data, params, tick }) => {
    const { angularSpeed, pulseRate, pulseLifetime } = params;

    // Decay expired pulses.
    const cutoff = tick - pulseLifetime;
    const pulses: Pulse[] = data.pulses.filter((p) => p.bornTick > cutoff);

    // Maybe spawn a new pulse.
    if (Math.random() < pulseRate) {
      pulses.push({
        anchor: Math.floor(Math.random() * PULSE_ANCHORS.length),
        bornTick: tick,
      });
    }

    return {
      angle: data.angle + angularSpeed,
      pulses,
    };
  },
});
