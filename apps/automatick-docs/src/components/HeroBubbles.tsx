import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { AutomatickBubblesCanvas } from '../demos/AutomatickBubblesDemo';
import automatickBubblesSim from '../sims/automatickBubblesSim';

const initialParams = {
  nbBubbles: 5000,
  blobSize: 6,
  blobSizeVariance: 1.0,
  baseSpeed: 3.9,
  minSpeedFactor: 0.18,
  vyJitter: 0.345,
  trailFade: 0.445,
  outsideBlendMode: 'lighter' as const,
  showMask: false,
};

/**
 * Home-page hero: bubbles flowing left to right with the wordmark emerging
 * from the in-mask slowdown. Full viewport width; ~50vh tall. Intentionally
 * has no chrome — the canvas is the hero.
 */
export function HeroBubbles() {
  return (
    <Simulation
      sim={automatickBubblesSim}
      delayMs={16}
      params={initialParams}
      autoplay
    >
      <div
        style={{
          width: '100%',
          height: '50vh',
          minHeight: 380,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AutomatickBubblesCanvas minHeight='50vh' showPerf={false} />
      </div>
    </Simulation>
  );
}
