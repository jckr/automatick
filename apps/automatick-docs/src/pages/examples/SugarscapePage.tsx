import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { SugarscapeDemo } from '../../demos/SugarscapeDemo';

export function SugarscapePage() {
  return (
    <ExamplePage
      title='Sugarscape'
      description={
        <>
          <p>
            Epstein and Axtell{"'"}s classic artificial society. Agents live on
            a landscape of two sugar mountains, each cell holding a renewable
            store of sugar. Every tick an agent looks out to the limit of its
            vision, moves to the richest cell it can see, harvests the sugar,
            and pays its metabolism. When its sugar runs out, it dies.
          </p>
          <p>
            Nobody is told to hoard, yet stark wealth inequality emerges from
            the unequal distribution of vision, metabolism, and luck. The Gini
            coefficient in the chart tracks that inequality over time — agents
            with good vision and low metabolism accumulate far more than the
            rest.
          </p>
        </>
      }
    >
      <SugarscapeDemo />
    </ExamplePage>
  );
}
