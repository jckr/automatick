import { defineSim } from 'automatick/sim';

export const ERO_SIZE = 220;

export type ErosionData = {
  heightmap: Float32Array;
  water: Float32Array;
  size: number;
};

export type ErosionParams = {
  dropsPerTick: number;
  erosionRate: number;
  depositionRate: number;
  evaporation: number;
  inertia: number;
  capacityFactor: number;
  noiseScale: number;
  noiseOctaves: number;
  seed: number;
};

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function valueNoiseLayer(size: number, freq: number, rand: () => number): Float32Array {
  const cells = freq + 1;
  const lattice = new Float32Array(cells * cells);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand();

  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * freq;
      const fy = (y / size) * freq;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const v00 = lattice[y0 * cells + x0];
      const v10 = lattice[y0 * cells + x0 + 1];
      const v01 = lattice[(y0 + 1) * cells + x0];
      const v11 = lattice[(y0 + 1) * cells + x0 + 1];
      const top = v00 + (v10 - v00) * sx;
      const bot = v01 + (v11 - v01) * sx;
      out[y * size + x] = top + (bot - top) * sy;
    }
  }
  return out;
}

function generateTerrain(
  size: number,
  baseFreq: number,
  octaves: number,
  seed: number,
): Float32Array {
  const rand = mulberry32(seed);
  const height = new Float32Array(size * size);
  let amplitude = 1;
  let freq = Math.max(2, Math.round(baseFreq));
  let totalAmp = 0;
  for (let o = 0; o < octaves; o++) {
    const layer = valueNoiseLayer(size, freq, rand);
    for (let i = 0; i < height.length; i++) height[i] += layer[i] * amplitude;
    totalAmp += amplitude;
    amplitude *= 0.5;
    freq *= 2;
  }
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < height.length; i++) {
    height[i] /= totalAmp;
    if (height[i] < min) min = height[i];
    if (height[i] > max) max = height[i];
  }
  const range = max - min || 1;
  for (let i = 0; i < height.length; i++) {
    height[i] = (height[i] - min) / range;
  }
  return height;
}

// Bilinear height + gradient at a continuous position.
function heightAndGradient(
  h: Float32Array,
  size: number,
  px: number,
  py: number,
): { height: number; gradX: number; gradY: number } {
  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const u = px - x0;
  const v = py - y0;
  const i = y0 * size + x0;
  const hNW = h[i];
  const hNE = h[i + 1];
  const hSW = h[i + size];
  const hSE = h[i + size + 1];

  const gradX = (hNE - hNW) * (1 - v) + (hSE - hSW) * v;
  const gradY = (hSW - hNW) * (1 - u) + (hSE - hNE) * u;
  const height =
    hNW * (1 - u) * (1 - v) +
    hNE * u * (1 - v) +
    hSW * (1 - u) * v +
    hSE * u * v;
  return { height, gradX, gradY };
}

const MAX_LIFETIME = 60;
const MIN_CAPACITY = 0.001;
const GRAVITY = 4;

export default defineSim<ErosionData, ErosionParams>({
  defaultParams: {
    dropsPerTick: 120,
    erosionRate: 0.3,
    depositionRate: 0.3,
    evaporation: 0.02,
    inertia: 0.05,
    capacityFactor: 4,
    noiseScale: 4,
    noiseOctaves: 5,
    seed: 1,
  },

  init: (params) => {
    const size = ERO_SIZE;
    const heightmap = generateTerrain(
      size,
      params.noiseScale,
      params.noiseOctaves,
      params.seed,
    );
    return { heightmap, water: new Float32Array(size * size), size };
  },

  step: ({ data, params }) => {
    const { heightmap, water, size } = data;
    const {
      dropsPerTick,
      erosionRate,
      depositionRate,
      evaporation,
      inertia,
      capacityFactor,
    } = params;

    for (let i = 0; i < water.length; i++) water[i] *= 0.9;

    for (let d = 0; d < dropsPerTick; d++) {
      let px = Math.random() * (size - 2) + 0.5;
      let py = Math.random() * (size - 2) + 0.5;
      let dirX = 0;
      let dirY = 0;
      let speed = 1;
      let waterAmt = 1;
      let sediment = 0;

      for (let life = 0; life < MAX_LIFETIME; life++) {
        const nodeX = Math.floor(px);
        const nodeY = Math.floor(py);
        const cellOffX = px - nodeX;
        const cellOffY = py - nodeY;
        const dropletIndex = nodeY * size + nodeX;

        const { height, gradX, gradY } = heightAndGradient(heightmap, size, px, py);

        dirX = dirX * inertia - gradX * (1 - inertia);
        dirY = dirY * inertia - gradY * (1 - inertia);
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len !== 0) {
          dirX /= len;
          dirY /= len;
        } else {
          break;
        }

        px += dirX;
        py += dirY;

        if (px < 1 || px >= size - 1 || py < 1 || py >= size - 1) break;

        water[dropletIndex] += waterAmt;

        const newHeight = heightAndGradient(heightmap, size, px, py).height;
        const deltaHeight = newHeight - height;

        const capacity = Math.max(
          -deltaHeight * speed * waterAmt * capacityFactor,
          MIN_CAPACITY,
        );

        if (sediment > capacity || deltaHeight > 0) {
          const deposit =
            deltaHeight > 0
              ? Math.min(deltaHeight, sediment)
              : (sediment - capacity) * depositionRate;
          sediment -= deposit;
          heightmap[dropletIndex] += deposit * (1 - cellOffX) * (1 - cellOffY);
          heightmap[dropletIndex + 1] += deposit * cellOffX * (1 - cellOffY);
          heightmap[dropletIndex + size] += deposit * (1 - cellOffX) * cellOffY;
          heightmap[dropletIndex + size + 1] += deposit * cellOffX * cellOffY;
        } else {
          const erode = Math.min((capacity - sediment) * erosionRate, -deltaHeight);
          heightmap[dropletIndex] -= erode * (1 - cellOffX) * (1 - cellOffY);
          heightmap[dropletIndex + 1] -= erode * cellOffX * (1 - cellOffY);
          heightmap[dropletIndex + size] -= erode * (1 - cellOffX) * cellOffY;
          heightmap[dropletIndex + size + 1] -= erode * cellOffX * cellOffY;
          sediment += erode;
        }

        speed = Math.sqrt(Math.max(0, speed * speed + deltaHeight * -GRAVITY));
        waterAmt *= 1 - evaporation;
        if (waterAmt < 0.01) break;
      }
    }

    return { heightmap, water, size };
  },
});
