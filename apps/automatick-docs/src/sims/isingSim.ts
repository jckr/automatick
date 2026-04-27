import { defineSim } from 'automatick/sim';

const W = 200;
const H = 200;
const N = W * H;

export type IsingData = {
  spins: Int8Array;
  magnetization: number;
  energy: number;
};

export type IsingParams = {
  T: number;
  externalField: number;
  sweepsPerTick: number;
};

function computeEnergy(spins: Int8Array, h: number): number {
  let e = 0;
  for (let y = 0; y < H; y++) {
    const yS = y === H - 1 ? 0 : y + 1;
    for (let x = 0; x < W; x++) {
      const xE = x === W - 1 ? 0 : x + 1;
      const i = y * W + x;
      const s = spins[i];
      e += -s * (spins[y * W + xE] + spins[yS * W + x]);
      e += -h * s;
    }
  }
  return e / N;
}

export default defineSim<IsingData, IsingParams>({
  defaultParams: {
    T: 2.3,
    externalField: 0,
    sweepsPerTick: 2,
  },

  init: ({ externalField }) => {
    const spins = new Int8Array(N);
    let mSum = 0;
    for (let i = 0; i < N; i++) {
      const s = Math.random() < 0.5 ? 1 : -1;
      spins[i] = s;
      mSum += s;
    }
    return {
      spins,
      magnetization: mSum / N,
      energy: computeEnergy(spins, externalField),
    };
  },

  step: ({ data, params }) => {
    const { T, externalField, sweepsPerTick } = params;
    const spins = new Int8Array(data.spins);
    let mSum = data.magnetization * N;
    let eSum = data.energy * N;
    const invT = 1 / T;

    for (let sweep = 0; sweep < sweepsPerTick; sweep++) {
      for (let k = 0; k < N; k++) {
        const i = (Math.random() * N) | 0;
        const x = i % W;
        const y = (i / W) | 0;
        const xW = x === 0 ? W - 1 : x - 1;
        const xE = x === W - 1 ? 0 : x + 1;
        const yN = y === 0 ? H - 1 : y - 1;
        const yS = y === H - 1 ? 0 : y + 1;
        const neighborSum =
          spins[y * W + xW] +
          spins[y * W + xE] +
          spins[yN * W + x] +
          spins[yS * W + x];
        const s = spins[i];
        const dE = 2 * s * (neighborSum + externalField);
        if (dE <= 0 || Math.random() < Math.exp(-dE * invT)) {
          spins[i] = -s;
          mSum += -2 * s;
          eSum += dE;
        }
      }
    }

    return {
      spins,
      magnetization: mSum / N,
      energy: eSum / N,
    };
  },
});
