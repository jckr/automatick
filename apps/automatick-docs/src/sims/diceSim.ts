import { defineSim } from 'automatick/sim';

export type DiceParams = { nbDice: number };

export type DiceData = {
  rolls: number[];
  average: number;
  total: number;
  /** Count per possible sum (nbDice ... 6*nbDice). */
  totals: Record<number, number>;
};

export default defineSim<DiceData, DiceParams>({
  defaultParams: { nbDice: 2 },

  init: (params) => ({
    rolls: [],
    average: 3.5 * params.nbDice,
    total: 0,
    totals: {},
  }),

  step: ({ data, params, tick, random }) => {
    const { nbDice } = params;
    const rolls: number[] = [];
    let total = 0;
    for (let i = 0; i < nbDice; i++) {
      const r = random.int(1, 6);
      rolls.push(r);
      total += r;
    }
    const updatedTotals = { ...data.totals, [total]: (data.totals[total] ?? 0) + 1 };
    const average = (data.average * (tick - 1) + total) / tick;
    return { rolls, average, total, totals: updatedTotals };
  },
});
