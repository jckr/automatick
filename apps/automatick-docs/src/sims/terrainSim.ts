import { defineSim } from 'automatick/sim';

export const TERRAIN_SIZE = 220;

export type TerrainData = {
  heightmap: Float32Array;
  moisture: Float32Array;
  water: Float32Array;
  size: number;
  age: number;
};

export type TerrainParams = {
  noiseScale: number;
  noiseOctaves: number;
  seaLevel: number;
  evolutionSpeed: number;
  dropsPerTick: number;
  erosionRate: number;
  depositionRate: number;
  thermalErosionRate: number;
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

function fractalNoise(
  size: number,
  baseFreq: number,
  octaves: number,
  rand: () => number,
): Float32Array {
  const field = new Float32Array(size * size);
  let amplitude = 1;
  let freq = Math.max(2, Math.round(baseFreq));
  let totalAmp = 0;
  for (let o = 0; o < octaves; o++) {
    const layer = valueNoiseLayer(size, freq, rand);
    for (let i = 0; i < field.length; i++) field[i] += layer[i] * amplitude;
    totalAmp += amplitude;
    amplitude *= 0.5;
    freq *= 2;
  }
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < field.length; i++) {
    field[i] /= totalAmp;
    if (field[i] < min) min = field[i];
    if (field[i] > max) max = field[i];
  }
  const range = max - min || 1;
  for (let i = 0; i < field.length; i++) field[i] = (field[i] - min) / range;
  return field;
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

const MAX_LIFETIME = 50;
const MIN_CAPACITY = 0.001;
const GRAVITY = 4;
const EVAPORATION = 0.02;
const INERTIA = 0.05;
const CAPACITY_FACTOR = 4;
const TALUS = 0.012; // thermal erosion slope threshold

function hydraulicErosion(
  heightmap: Float32Array,
  water: Float32Array,
  size: number,
  drops: number,
  erosionRate: number,
  depositionRate: number,
) {
  for (let d = 0; d < drops; d++) {
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

      dirX = dirX * INERTIA - gradX * (1 - INERTIA);
      dirY = dirY * INERTIA - gradY * (1 - INERTIA);
      const len = Math.sqrt(dirX * dirX + dirY * dirY);
      if (len !== 0) {
        dirX /= len;
        dirY /= len;
      } else break;

      px += dirX;
      py += dirY;
      if (px < 1 || px >= size - 1 || py < 1 || py >= size - 1) break;

      water[dropletIndex] += waterAmt;

      const newHeight = heightAndGradient(heightmap, size, px, py).height;
      const deltaHeight = newHeight - height;
      const capacity = Math.max(
        -deltaHeight * speed * waterAmt * CAPACITY_FACTOR,
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
      waterAmt *= 1 - EVAPORATION;
      if (waterAmt < 0.01) break;
    }
  }
}

// Thermal erosion: where a slope to a neighbor exceeds the talus threshold,
// move a little material from the higher cell to the lower one. Smooths cliffs.
function thermalErosion(heightmap: Float32Array, size: number, rate: number) {
  if (rate <= 0) return;
  const delta = new Float32Array(heightmap.length);
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      const h = heightmap[i];
      const neighbors = [i - 1, i + 1, i - size, i + size];
      for (const ni of neighbors) {
        const diff = h - heightmap[ni];
        if (diff > TALUS) {
          const move = (diff - TALUS) * 0.5 * rate;
          delta[i] -= move;
          delta[ni] += move;
        }
      }
    }
  }
  for (let i = 0; i < heightmap.length; i++) heightmap[i] += delta[i];
}

export default defineSim<TerrainData, TerrainParams>({
  defaultParams: {
    noiseScale: 4,
    noiseOctaves: 5,
    seaLevel: 0.32,
    evolutionSpeed: 1,
    dropsPerTick: 150,
    erosionRate: 0.3,
    depositionRate: 0.3,
    thermalErosionRate: 0.04,
    seed: 1,
  },

  init: (params) => {
    const size = TERRAIN_SIZE;
    const rand = mulberry32(params.seed | 0 || 1);
    const heightmap = fractalNoise(size, params.noiseScale, params.noiseOctaves, rand);
    const moisture = fractalNoise(size, Math.max(2, params.noiseScale - 1), 4, rand);
    return {
      heightmap,
      moisture,
      water: new Float32Array(size * size),
      size,
      age: 0,
    };
  },

  step: ({ data, params }) => {
    const { heightmap, moisture, water, size } = data;
    const {
      evolutionSpeed,
      dropsPerTick,
      erosionRate,
      depositionRate,
      thermalErosionRate,
    } = params;

    for (let i = 0; i < water.length; i++) water[i] *= 0.9;

    const passes = Math.max(1, Math.round(evolutionSpeed));
    for (let p = 0; p < passes; p++) {
      hydraulicErosion(
        heightmap,
        water,
        size,
        dropsPerTick,
        erosionRate,
        depositionRate,
      );
      thermalErosion(heightmap, size, thermalErosionRate);
    }

    return { heightmap, moisture, water, size, age: data.age + passes };
  },
});
