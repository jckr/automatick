import { defineSim } from 'automatick/sim';

const W = 200;
const H = 200;
const HOME_X = 100;
const HOME_Y = 100;
const HOME_RADIUS = 5;
const FOOD_RADIUS = 15;
const FOOD_PER_CELL = 30;
const SENSOR_DISTANCE = 5;
const SPEED = 1.0;
const PHER_CAP = 10;

const FOOD_SOURCES: [number, number][] = [
  [30, 30],
  [170, 40],
  [40, 170],
];

export type AntColonyData = {
  antX: Float32Array;
  antY: Float32Array;
  antAngle: Float32Array;
  antCarrying: Uint8Array;
  homePher: Float32Array;
  foodPher: Float32Array;
  food: Uint32Array;
  width: number;
  height: number;
};

export type AntColonyParams = {
  antCount: number;
  evaporation: number;
  depositAmount: number;
  sensorAngle: number;
};

const sampleAt = (grid: Float32Array, x: number, y: number): number => {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cx < 0 || cx >= W || cy < 0 || cy >= H) return 0;
  return grid[cy * W + cx];
};

export default defineSim<AntColonyData, AntColonyParams>({
  defaultParams: {
    antCount: 800,
    evaporation: 0.01,
    depositAmount: 0.5,
    sensorAngle: 0.5,
  },

  init: ({ antCount }) => {
    const antX = new Float32Array(antCount);
    const antY = new Float32Array(antCount);
    const antAngle = new Float32Array(antCount);
    const antCarrying = new Uint8Array(antCount);
    for (let i = 0; i < antCount; i++) {
      antX[i] = HOME_X;
      antY[i] = HOME_Y;
      antAngle[i] = Math.random() * Math.PI * 2;
    }

    const homePher = new Float32Array(W * H);
    const foodPher = new Float32Array(W * H);
    const food = new Uint32Array(W * H);

    for (const [fx, fy] of FOOD_SOURCES) {
      for (let y = Math.max(0, fy - FOOD_RADIUS); y < Math.min(H, fy + FOOD_RADIUS); y++) {
        for (let x = Math.max(0, fx - FOOD_RADIUS); x < Math.min(W, fx + FOOD_RADIUS); x++) {
          const dx = x - fx;
          const dy = y - fy;
          if (dx * dx + dy * dy <= FOOD_RADIUS * FOOD_RADIUS) {
            food[y * W + x] = FOOD_PER_CELL;
          }
        }
      }
    }

    return {
      antX,
      antY,
      antAngle,
      antCarrying,
      homePher,
      foodPher,
      food,
      width: W,
      height: H,
    };
  },

  step: ({ data, params }) => {
    const { evaporation, depositAmount, sensorAngle } = params;
    const { antX, antY, antAngle, antCarrying, homePher, foodPher, food } = data;
    const n = antX.length;
    const decay = 1 - evaporation;

    for (let i = 0; i < W * H; i++) {
      const hp = homePher[i];
      if (hp > 1e-4) homePher[i] = hp * decay;
      else if (hp !== 0) homePher[i] = 0;
      const fp = foodPher[i];
      if (fp > 1e-4) foodPher[i] = fp * decay;
      else if (fp !== 0) foodPher[i] = 0;
    }

    for (let i = 0; i < n; i++) {
      const carrying = antCarrying[i] === 1;
      const target = carrying ? homePher : foodPher;
      const a = antAngle[i];
      const x = antX[i];
      const y = antY[i];

      const aL = a - sensorAngle;
      const aR = a + sensorAngle;
      const sL = sampleAt(target, x + Math.cos(aL) * SENSOR_DISTANCE, y + Math.sin(aL) * SENSOR_DISTANCE);
      const sC = sampleAt(target, x + Math.cos(a) * SENSOR_DISTANCE, y + Math.sin(a) * SENSOR_DISTANCE);
      const sR = sampleAt(target, x + Math.cos(aR) * SENSOR_DISTANCE, y + Math.sin(aR) * SENSOR_DISTANCE);

      let newAngle = a;
      if (sC >= sL && sC >= sR) {
        newAngle = a;
      } else if (sL > sR) {
        newAngle = aL;
      } else {
        newAngle = aR;
      }
      newAngle += (Math.random() - 0.5) * 0.4;

      let nx = x + Math.cos(newAngle) * SPEED;
      let ny = y + Math.sin(newAngle) * SPEED;

      if (nx < 0) {
        nx = -nx;
        newAngle = Math.PI - newAngle;
      } else if (nx >= W) {
        nx = 2 * (W - 1) - nx;
        newAngle = Math.PI - newAngle;
      }
      if (ny < 0) {
        ny = -ny;
        newAngle = -newAngle;
      } else if (ny >= H) {
        ny = 2 * (H - 1) - ny;
        newAngle = -newAngle;
      }

      antX[i] = nx;
      antY[i] = ny;
      antAngle[i] = newAngle;

      const cx = Math.floor(nx);
      const cy = Math.floor(ny);
      const cell = cy * W + cx;

      if (!carrying && food[cell] > 0) {
        food[cell] -= 1;
        antCarrying[i] = 1;
        antAngle[i] = newAngle + Math.PI;
      } else if (carrying) {
        const dxh = nx - HOME_X;
        const dyh = ny - HOME_Y;
        if (dxh * dxh + dyh * dyh < HOME_RADIUS * HOME_RADIUS) {
          antCarrying[i] = 0;
          antAngle[i] = newAngle + Math.PI;
        }
      }

      const nowCarrying = antCarrying[i] === 1;
      if (nowCarrying) {
        const v = foodPher[cell] + depositAmount;
        foodPher[cell] = v > PHER_CAP ? PHER_CAP : v;
      } else {
        const v = homePher[cell] + depositAmount;
        homePher[cell] = v > PHER_CAP ? PHER_CAP : v;
      }
    }

    return {
      antX,
      antY,
      antAngle,
      antCarrying,
      homePher,
      foodPher,
      food,
      width: W,
      height: H,
    };
  },
});
