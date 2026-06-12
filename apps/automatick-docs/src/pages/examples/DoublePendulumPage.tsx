import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { DoublePendulumDemo } from '../../demos/DoublePendulumDemo';

export function DoublePendulumPage() {
  return (
    <ExamplePage
      title='Double Pendulum'
      description={
        <>
          <p>
            Two pendulums coupled end to end, integrated with the standard
            double-pendulum equations of motion. The system is fully
            deterministic yet chaotic: the fading trail traces the tip&rsquo;s
            path, revealing how quickly trajectories diverge. RK4 integration
            with sub-steps keeps the motion stable.
          </p>
          <p>
            Start the arms near horizontal for immediate chaos. Spawn 2 or 3
            copies with imperceptibly different starting angles and watch them
            drift apart within seconds &mdash; the signature of sensitive
            dependence on initial conditions.
          </p>
        </>
      }
    >
      <DoublePendulumDemo />
    </ExamplePage>
  );
}
