import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { ChaoticPendulumDemo } from '../../demos/ChaoticPendulumDemo';

export function ChaoticPendulumPage() {
  return (
    <ExamplePage
      title='Chaotic Pendulum'
      description={
        <>
          <p>
            A chain of point masses linked by rigid arms, integrated from the
            general N-pendulum equations of motion &mdash; two nodes is the
            classic double pendulum, but you can add or remove nodes live and
            tune each arm&rsquo;s length and each bob&rsquo;s mass while it
            swings. The system is fully deterministic yet chaotic: the fading
            trail traces the tip&rsquo;s path, revealing how quickly
            trajectories diverge. RK4 integration with sub-steps keeps the
            motion stable.
          </p>
          <p>
            Start the arms near horizontal for immediate chaos, then grow the
            chain to three or more nodes to watch the motion turn wild. Spawn 2
            or 3 copies with imperceptibly different starting angles and watch
            them drift apart within seconds &mdash; the signature of sensitive
            dependence on initial conditions. Stretch the trail out to leave a
            longer luminous wake behind the tip.
          </p>
        </>
      }
    >
      <ChaoticPendulumDemo />
    </ExamplePage>
  );
}
