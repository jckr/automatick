import { defineSim } from 'automatick/sim';

const SIZE = 10;
const TOTAL = SIZE * SIZE;

export type Data = { cells: boolean[] };
export type Params = Record<string, never>;

export default defineSim<Data, Params>({
  init: { cells: new Array(TOTAL).fill(false) },
  step: ({ data, tick }) => {
    data.cells[tick - 1] = true;
    return data;
  },
  shouldStop: (data) => Boolean(data.cells.at(-1)),
});
