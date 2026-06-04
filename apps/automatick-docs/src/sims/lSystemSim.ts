import { defineSim } from 'automatick/sim';

export type LSystemPreset =
  | 'plant'
  | 'tree'
  | 'koch'
  | 'sierpinski'
  | 'dragon';

export type LSystemData = {
  current: string;
  generation: number;
};

export type LSystemParams = {
  preset: LSystemPreset;
  angle: number;
  maxGenerations: number;
};

type PresetDef = {
  axiom: string;
  rules: Record<string, string>;
  angle: number;
};

// Each preset: axiom + production rules + a sensible default angle (degrees).
export const PRESETS: Record<LSystemPreset, PresetDef> = {
  plant: {
    axiom: 'X',
    rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' },
    angle: 25,
  },
  tree: {
    axiom: 'F',
    rules: { F: 'F[+F]F[-F]F' },
    angle: 25,
  },
  koch: {
    axiom: 'F',
    rules: { F: 'F+F-F-F+F' },
    angle: 90,
  },
  sierpinski: {
    axiom: 'A',
    rules: { A: 'B-A-B', B: 'A+B+A' },
    angle: 60,
  },
  dragon: {
    axiom: 'FX',
    rules: { X: 'X+YF+', Y: '-FX-Y' },
    angle: 90,
  },
};

// Cap so exponential growth can't blow up memory.
const MAX_STRING_LENGTH = 200000;

function rewrite(input: string, rules: Record<string, string>): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    out += rules[c] ?? c;
    if (out.length > MAX_STRING_LENGTH) break;
  }
  return out;
}

export default defineSim<LSystemData, LSystemParams>({
  defaultParams: {
    preset: 'plant',
    angle: 25,
    maxGenerations: 6,
  },

  init: (params) => {
    const preset = PRESETS[params.preset];
    return { current: preset.axiom, generation: 0 };
  },

  step: ({ data, params }) => {
    const preset = PRESETS[params.preset];
    if (
      data.generation >= params.maxGenerations ||
      data.current.length > MAX_STRING_LENGTH
    ) {
      return data;
    }
    const next = rewrite(data.current, preset.rules);
    return { current: next, generation: data.generation + 1 };
  },

  shouldStop: (data, params) =>
    data.generation >= params.maxGenerations ||
    data.current.length > MAX_STRING_LENGTH,
});
