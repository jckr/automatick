import React from 'react';
import { GravityDemo } from '../../demos/GravityDemo';

export function GravityPage() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>N-Body Gravity</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.55, maxWidth: 720 }}>
        Particles attract each other through gravitational force. Each step
        computes O(n&sup2;) pairwise interactions &mdash; with 200+ particles,
        this is expensive enough to block the main thread. When two bodies
        touch they are both destroyed and respawned at random positions; a
        particle&rsquo;s color encodes how many times it has respawned (blue &rarr;
        cyan &rarr; green &rarr; yellow &rarr; orange &rarr; red &rarr; magenta &rarr; purple, cycling).
      </p>
      <GravityDemo />
    </div>
  );
}
