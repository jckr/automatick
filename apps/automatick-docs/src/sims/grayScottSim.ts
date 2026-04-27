import { defineSim } from 'automatick/sim';

const W = 200;
const H = 200;
const Du = 0.16;
const Dv = 0.08;

export type GrayScottData = {
  u: Float32Array;
  v: Float32Array;
  width: number;
  height: number;
};

export type GrayScottParams = {
  F: number;
  k: number;
  dt: number;
  subTicks: number;
};

export default defineSim<GrayScottData, GrayScottParams>({
  defaultParams: {
    F: 0.035,
    k: 0.065,
    dt: 1.0,
    subTicks: 4,
  },

  init: () => {
    const u = new Float32Array(W * H);
    const v = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      u[i] = 1.0;
      v[i] = 0.0;
    }
    const seedSize = 20;
    const x0 = Math.floor((W - seedSize) / 2);
    const y0 = Math.floor((H - seedSize) / 2);
    for (let y = y0; y < y0 + seedSize; y++) {
      for (let x = x0; x < x0 + seedSize; x++) {
        const i = y * W + x;
        u[i] = 0.5 + (Math.random() - 0.5) * 0.01;
        v[i] = 0.25 + (Math.random() - 0.5) * 0.01;
      }
    }
    return { u, v, width: W, height: H };
  },

  step: ({ data, params }) => {
    const { F, k, dt, subTicks } = params;

    let uCur = new Float32Array(data.u);
    let vCur = new Float32Array(data.v);
    let uNext = new Float32Array(W * H);
    let vNext = new Float32Array(W * H);

    for (let s = 0; s < subTicks; s++) {
      for (let y = 0; y < H; y++) {
        const yN = y === 0 ? H - 1 : y - 1;
        const yS = y === H - 1 ? 0 : y + 1;
        for (let x = 0; x < W; x++) {
          const xW = x === 0 ? W - 1 : x - 1;
          const xE = x === W - 1 ? 0 : x + 1;
          const i = y * W + x;
          const uc = uCur[i];
          const vc = vCur[i];
          const lapU =
            uCur[y * W + xW] +
            uCur[y * W + xE] +
            uCur[yN * W + x] +
            uCur[yS * W + x] -
            4 * uc;
          const lapV =
            vCur[y * W + xW] +
            vCur[y * W + xE] +
            vCur[yN * W + x] +
            vCur[yS * W + x] -
            4 * vc;
          const uv2 = uc * vc * vc;
          const du = Du * lapU - uv2 + F * (1 - uc);
          const dv = Dv * lapV + uv2 - (F + k) * vc;
          uNext[i] = uc + du * dt;
          vNext[i] = vc + dv * dt;
        }
      }
      const tmpU = uCur;
      const tmpV = vCur;
      uCur = uNext;
      vCur = vNext;
      uNext = tmpU;
      vNext = tmpV;
    }

    return { u: uCur, v: vCur, width: W, height: H };
  },
});
