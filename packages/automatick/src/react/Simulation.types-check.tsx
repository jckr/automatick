/**
 * Type-level tests for the `<Simulation>` prop union.
 *
 * No runtime body — these assertions live at module scope so `tsc` checks them
 * via the `test:types` script. `@ts-expect-error` lines are inverted
 * assertions: removing one makes the build fail, which means the disallowed
 * combination is silently allowed again.
 *
 * Filename intentionally avoids `.test.ts` so vitest does not pick it up.
 * The package tsconfig's `include: ["src"]` ensures tsc still checks it.
 */
import * as React from 'react';
import { Simulation } from './Simulation';
import { defineSim } from '../sim';

// ---------------------------------------------------------------------------
// Type assertion helpers — no runtime cost.
// ---------------------------------------------------------------------------

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

function assertType<_T extends true>(): void {}

// ---------------------------------------------------------------------------
// Sim modules used by the tests.
// ---------------------------------------------------------------------------

const counterSim = defineSim<{ count: number }, { increment: number }>({
  defaultParams: { increment: 1 },
  init: () => ({ count: 0 }),
  step: ({ data, params }) => ({ count: data.count + params.increment }),
});

const paramlessSim = defineSim<{ count: number }>({
  init: { count: 0 },
  step: ({ data }) => ({ count: data.count + 1 }),
});

// ---------------------------------------------------------------------------
// 1. sim={module} form continues to type-check (regression).
// ---------------------------------------------------------------------------

const _simForm = <Simulation sim={counterSim} />;
const _simFormParamless = <Simulation sim={paramlessSim} />;

// ---------------------------------------------------------------------------
// 2. Inline form, paramless: Data is inferred from `init` value.
// ---------------------------------------------------------------------------

const _inlineParamless = (
  <Simulation
    init={{ count: 0 }}
    step={({ data }) => ({ count: data.count + 1 })}
  />
);

// Data inferred via the step callback's argument:
<Simulation
  init={{ count: 0 }}
  step={(state) => {
    assertType<Equals<typeof state.data, { count: number }>>();
    return { count: state.data.count + 1 };
  }}
/>;

// ---------------------------------------------------------------------------
// 3. Inline form, with defaultParams: Params flows into step args.
// ---------------------------------------------------------------------------

<Simulation
  defaultParams={{ inc: 1 }}
  init={() => ({ count: 0 })}
  step={(state) => {
    assertType<Equals<typeof state.params, { inc: number }>>();
    assertType<Equals<typeof state.data, { count: number }>>();
    return { count: state.data.count + state.params.inc };
  }}
/>;

// ---------------------------------------------------------------------------
// 4. Inline form, function init that depends on params.
// ---------------------------------------------------------------------------

<Simulation
  defaultParams={{ start: 5 }}
  init={(params) => {
    assertType<Equals<typeof params, { start: number }>>();
    return { count: params.start };
  }}
  step={({ data }) => ({ count: data.count + 1 })}
/>;

// ---------------------------------------------------------------------------
// 5. Mutually exclusive props.
// ---------------------------------------------------------------------------

// `@ts-expect-error` only suppresses errors on the *next* line, so each case
// is written as a one-liner where the offending prop and the error point to
// the same source line.

// prettier-ignore
// @ts-expect-error sim and init are mutually exclusive
const _bothSimAndInline = <Simulation sim={counterSim} init={{ count: 0 }} step={({ data }) => ({ count: data.count })} />;

// prettier-ignore
// @ts-expect-error sim and worker are mutually exclusive
const _bothSimAndWorker = <Simulation sim={counterSim} worker={() => Promise.resolve({ default: counterSim })} />;

// prettier-ignore
// @ts-expect-error worker and inline are mutually exclusive
const _bothWorkerAndInline = <Simulation worker={() => Promise.resolve({ default: counterSim })} init={{ count: 0 }} step={({ data }) => ({ count: data.count })} />;

// @ts-expect-error inline form requires both init and step
const _inlineMissingStep = <Simulation init={{ count: 0 }} />;

// prettier-ignore
// @ts-expect-error inline form requires both init and step
const _inlineMissingInit = <Simulation step={({ data }: { data: { count: number } }) => data} />;

// Suppress unused-binding lint by referencing the assertions module-level.
export {
  _simForm,
  _simFormParamless,
  _inlineParamless,
  _bothSimAndInline,
  _bothSimAndWorker,
  _bothWorkerAndInline,
  _inlineMissingStep,
  _inlineMissingInit,
};
