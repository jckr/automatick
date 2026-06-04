import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { SpringMassDemo } from '../../demos/SpringMassDemo';

export function SpringMassPage() {
  return (
    <ExamplePage
      title='Spring-Mass System'
      description={
        <>
          <p>
            Point masses connected by springs, each obeying Hooke's law: a
            spring pushes or pulls its endpoints in proportion to how far it is
            stretched or compressed from its rest length. Add gravity and a
            little velocity damping and the network sags, oscillates, and
            settles like a piece of jelly.
          </p>
          <p>
            Pinned anchor nodes (drawn as squares) hold the structure up while
            the free masses swing beneath them. Springs are tinted by strain —
            warm when stretched, cool when compressed. Try the Chain, Jelly, and
            Bridge presets, and push the stiffness up with low damping for a
            bouncier feel.
          </p>
        </>
      }
    >
      <SpringMassDemo />
    </ExamplePage>
  );
}
