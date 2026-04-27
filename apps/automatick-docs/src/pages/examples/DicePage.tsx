import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { DiceDemo } from '../../demos/DiceDemo';

export function DicePage() {
  return (
    <ExamplePage
      title='Dice'
      description={
        <p>
          This simulation throws dice and tallies the result over time. For one
          die, we expect roughly equal rolls for each value. For several dice,
          the bars follow a bell curve &mdash; but the actual shape can be quite
          different from the theoretical distribution. Random functions are not
          perfect.
        </p>
      }
    >
      <DiceDemo />
    </ExamplePage>
  );
}
