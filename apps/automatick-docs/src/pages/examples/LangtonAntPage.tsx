import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { LangtonAntDemo } from '../../demos/LangtonAntDemo';

export function LangtonAntPage() {
  return (
    <ExamplePage
      title="Langton's ant"
      description={
        <p>
          Classic 2-state Turing ant on a toroidal grid. Simulation ticks run in
          a Web Worker; rendering uses <code>selectRenderState</code> and draws
          on the main thread.
        </p>
      }
    >
      <LangtonAntDemo />
    </ExamplePage>
  );
}
