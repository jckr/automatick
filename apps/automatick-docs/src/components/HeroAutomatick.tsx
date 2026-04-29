import React from 'react';
import { Simulation } from 'automatick/react/simulation';
import { AutomatickHeroCanvas } from '../demos/AutomatickHeroDemo';
import automatickHeroSim from '../sims/automatickHeroSim';

const initialParams = {
  nbNodes: 6000,
  speed: 0.25,
  linkDistance: 20,
  p: 0.004,
  q: 0.55,
  showMask: false,
};

/**
 * Home-page hero. Mounts the same sim as the example page but with a slim
 * frame (no controls, no perf overlay) and full-content-width sizing. The
 * "automatick" wordmark emerges in the steady-state density of the
 * per-tick link rolls.
 */
export function HeroAutomatick() {
  return (
    <Simulation
      sim={automatickHeroSim}
      delayMs={16}
      params={initialParams}
      autoplay
    >
      <div className='hero-sim'>
        <div className='chrome'>
          <span className='dot' />
          <span className='file'>automatickHeroSim.ts</span>
        </div>
        <div className='stage'>
          <AutomatickHeroCanvas minHeight={380} showPerf={false} />
        </div>
      </div>
    </Simulation>
  );
}
