import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { RigidBodyDemo } from '../../demos/RigidBodyDemo';

export function RigidBodyPage() {
  return (
    <ExamplePage
      title='Rigid Body Physics'
      description={
        <>
          <p>
            Circular bodies fall under gravity and collide with one another and
            the walls of the bin. Each pair is checked for overlap; colliding
            bodies are pushed apart and exchange an impulse along the collision
            normal, scaled by their masses and the restitution (bounciness).
          </p>
          <p>
            Velocities are clamped and overlaps are resolved every sub-step, so
            the balls settle and stack rather than exploding. Turn up bounciness
            for a livelier pile, or enable &ldquo;Drop more&rdquo; to keep adding
            bodies from the top.
          </p>
        </>
      }
    >
      <RigidBodyDemo />
    </ExamplePage>
  );
}
