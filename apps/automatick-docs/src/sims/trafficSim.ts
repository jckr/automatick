import { defineSim } from 'automatick/sim';

export const TRAFFIC_ROAD_LENGTH = 1000;
export const TRAFFIC_LANES = 4;

export type TrafficData = {
  lanes: Int8Array;
  averageSpeed: number;
  carCount: number;
};

export type TrafficParams = {
  density: number;
  vMax: number;
  pSlow: number;
};

const cellIdx = (lane: number, x: number): number => lane * TRAFFIC_ROAD_LENGTH + x;

const gapAhead = (lanes: Int8Array, lane: number, x: number): number => {
  for (let d = 1; d <= TRAFFIC_ROAD_LENGTH; d++) {
    const nx = (x + d) % TRAFFIC_ROAD_LENGTH;
    if (lanes[cellIdx(lane, nx)] !== -1) return d - 1;
  }
  return TRAFFIC_ROAD_LENGTH;
};

const gapBehind = (lanes: Int8Array, lane: number, x: number): number => {
  for (let d = 1; d <= TRAFFIC_ROAD_LENGTH; d++) {
    const nx = (x - d + TRAFFIC_ROAD_LENGTH) % TRAFFIC_ROAD_LENGTH;
    if (lanes[cellIdx(lane, nx)] !== -1) return d - 1;
  }
  return TRAFFIC_ROAD_LENGTH;
};

export default defineSim<TrafficData, TrafficParams>({
  defaultParams: {
    density: 0.25,
    vMax: 5,
    pSlow: 0.15,
  },

  init: ({ density, vMax }) => {
    const size = TRAFFIC_ROAD_LENGTH * TRAFFIC_LANES;
    const lanes = new Int8Array(size);
    lanes.fill(-1);
    let carCount = 0;
    let speedSum = 0;
    for (let i = 0; i < size; i++) {
      if (Math.random() < density) {
        const v = Math.floor(Math.random() * (vMax + 1));
        lanes[i] = v;
        carCount++;
        speedSum += v;
      }
    }
    return {
      lanes,
      averageSpeed: carCount > 0 ? speedSum / carCount : 0,
      carCount,
    };
  },

  step: ({ data, params, tick }) => {
    const { vMax, pSlow } = params;
    const L = TRAFFIC_ROAD_LENGTH;
    const N = TRAFFIC_LANES;

    // Lane-change pass — even ticks try left, odd ticks try right to avoid oscillation.
    const scratch = new Int8Array(data.lanes);
    const direction = tick % 2 === 0 ? -1 : 1;

    for (let lane = 0; lane < N; lane++) {
      const target = lane + direction;
      if (target < 0 || target >= N) continue;
      for (let x = 0; x < L; x++) {
        const v = data.lanes[cellIdx(lane, x)];
        if (v < 0) continue;
        if (scratch[cellIdx(lane, x)] !== v) continue;
        if (scratch[cellIdx(target, x)] !== -1) continue;

        const ownGap = gapAhead(scratch, lane, x);
        if (ownGap >= v + 1) continue;

        const targetGapAhead = gapAhead(scratch, target, x);
        if (targetGapAhead <= v + 1) continue;

        const targetGapBehind = gapBehind(scratch, target, x);
        if (targetGapBehind < vMax) continue;

        scratch[cellIdx(lane, x)] = -1;
        scratch[cellIdx(target, x)] = v;
      }
    }

    // Velocity and position update into a fresh buffer.
    const next = new Int8Array(L * N);
    next.fill(-1);
    let carCount = 0;
    let speedSum = 0;

    for (let lane = 0; lane < N; lane++) {
      for (let x = 0; x < L; x++) {
        const cell = scratch[cellIdx(lane, x)];
        if (cell < 0) continue;

        let v = cell;
        if (v < vMax) v += 1;

        const gap = gapAhead(scratch, lane, x);
        if (v > gap) v = gap;

        if (v > 0 && Math.random() < pSlow) v -= 1;

        const nx = (x + v) % L;
        next[cellIdx(lane, nx)] = v;
        carCount++;
        speedSum += v;
      }
    }

    return {
      lanes: next,
      averageSpeed: carCount > 0 ? speedSum / carCount : 0,
      carCount,
    };
  },
});
