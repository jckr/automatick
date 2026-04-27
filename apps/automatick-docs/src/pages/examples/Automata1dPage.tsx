import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { Automata1dDemo } from '../../demos/Automata1dDemo';

export function Automata1dPage() {
  return (
    <ExamplePage
      title='1D cellular automata'
      description={
        <p>
          1D cellular automata are among the simplest of automata. Each line
          consists of cells which are either set or not. At each tick, a rule
          determines whether cells on the next line will be set based on the
          three cells above. There are 8 possible combinations
          (2&times;2&times;2), and for each, the rule determines the output
          &mdash; giving us 256 possible rules. You can select a rule by
          adjusting the slider or by clicking on each of the bits.
        </p>
      }
    >
      <Automata1dDemo />
    </ExamplePage>
  );
}
