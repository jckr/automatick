import { defineSim } from 'automatick/sim';

export type TraderStrategy = 'trend' | 'mean-revert' | 'random';

export type Trader = {
  cash: number;
  shares: number;
  strategy: TraderStrategy;
};

export type MarketData = {
  traders: Trader[];
  price: number;
  priceHistory: number[];
  volume: number;
  volatility: number;
};

export type MarketParams = {
  numTraders: number;
  initialPrice: number;
  trendFollowerPct: number;
  meanRevertPct: number;
  lookbackWindow: number;
  orderSize: number;
  priceImpact: number;
};

const MAX_HISTORY = 500;

function movingAverage(history: number[], lookback: number): number {
  const n = history.length;
  if (n === 0) return 0;
  const k = Math.min(lookback, n);
  let sum = 0;
  for (let i = n - k; i < n; i++) sum += history[i];
  return sum / k;
}

function rollingVolatility(history: number[], lookback: number): number {
  const n = history.length;
  if (n < 2) return 0;
  const k = Math.min(lookback, n);
  const start = n - k;
  let sum = 0;
  for (let i = start; i < n; i++) sum += history[i];
  const mean = sum / k;
  let varSum = 0;
  for (let i = start; i < n; i++) {
    const d = history[i] - mean;
    varSum += d * d;
  }
  return Math.sqrt(varSum / k);
}

export default defineSim<MarketData, MarketParams>({
  defaultParams: {
    numTraders: 200,
    initialPrice: 100,
    trendFollowerPct: 0.4,
    meanRevertPct: 0.4,
    lookbackWindow: 20,
    orderSize: 1,
    priceImpact: 0.3,
  },

  init: (params) => {
    const { numTraders, initialPrice, trendFollowerPct, meanRevertPct } =
      params;
    // Clamp the mix so fractions never exceed 1 (remainder = noise traders).
    const trendPct = Math.max(0, Math.min(1, trendFollowerPct));
    const revertPct = Math.max(0, Math.min(1 - trendPct, meanRevertPct));
    const nTrend = Math.round(numTraders * trendPct);
    const nRevert = Math.round(numTraders * revertPct);

    const traders: Trader[] = [];
    for (let i = 0; i < numTraders; i++) {
      let strategy: TraderStrategy;
      if (i < nTrend) strategy = 'trend';
      else if (i < nTrend + nRevert) strategy = 'mean-revert';
      else strategy = 'random';
      traders.push({ cash: 10000, shares: 100, strategy });
    }

    return {
      traders,
      price: initialPrice,
      priceHistory: [initialPrice],
      volume: 0,
      volatility: 0,
    };
  },

  step: ({ data, params, random }) => {
    const { lookbackWindow, orderSize, priceImpact, numTraders } = params;
    const { traders, priceHistory } = data;
    const price = data.price;
    const ma = movingAverage(priceHistory, lookbackWindow);

    // 1. Collect orders: +1 buy, -1 sell, 0 hold.
    let netDemand = 0;
    const orders = new Int8Array(traders.length);
    for (let i = 0; i < traders.length; i++) {
      const t = traders[i];
      let order = 0;
      if (t.strategy === 'trend') {
        order = price > ma ? 1 : price < ma ? -1 : 0;
      } else if (t.strategy === 'mean-revert') {
        order = price > ma ? -1 : price < ma ? 1 : 0;
      } else {
        order = random() < 0.5 ? 1 : -1;
      }
      orders[i] = order;
      netDemand += order;
    }

    // 2. Clear market: net order imbalance moves the price.
    let newPrice =
      price + (priceImpact * netDemand * orderSize) / Math.max(numTraders, 1);
    if (newPrice < 0.01) newPrice = 0.01;

    // 3. Execute trades at the new price (skip if insufficient cash/shares).
    let volume = 0;
    const cost = newPrice * orderSize;
    for (let i = 0; i < traders.length; i++) {
      const t = traders[i];
      const order = orders[i];
      if (order > 0 && t.cash >= cost) {
        t.cash -= cost;
        t.shares += orderSize;
        volume += orderSize;
      } else if (order < 0 && t.shares >= orderSize) {
        t.cash += cost;
        t.shares -= orderSize;
        volume += orderSize;
      }
    }

    // 4. Append to price history (bounded window).
    priceHistory.push(newPrice);
    if (priceHistory.length > MAX_HISTORY) {
      priceHistory.splice(0, priceHistory.length - MAX_HISTORY);
    }

    // 5. Rolling volatility.
    const volatility = rollingVolatility(priceHistory, lookbackWindow);

    return {
      traders,
      price: newPrice,
      priceHistory,
      volume,
      volatility,
    };
  },
});
