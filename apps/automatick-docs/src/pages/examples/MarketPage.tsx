import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { MarketDemo } from '../../demos/MarketDemo';

export function MarketPage() {
  return (
    <ExamplePage
      title='Market Simulation'
      description={
        <>
          <p>
            A toy stock market with no fundamentals — just traders reacting to
            price. Trend followers buy when the price is above its moving
            average and sell when it dips below; mean reverters do the
            opposite; noise traders flip a coin. Each tick the net order
            imbalance pushes the price, and trades execute at the new level.
          </p>
          <p>
            Realistic dynamics emerge from the mix. A market dominated by trend
            followers feeds on its own momentum, inflating bubbles that
            inevitably crash, while mean reverters dampen swings and stabilize
            the price. Watch for volatility clustering — calm stretches
            punctuated by bursts of turbulence.
          </p>
        </>
      }
    >
      <MarketDemo />
    </ExamplePage>
  );
}
