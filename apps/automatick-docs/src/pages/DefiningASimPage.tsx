import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './defining-a-sim.mdx';

export function DefiningASimPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'Defining a simulation' },
      ]}
      prev={{ label: 'Tutorial', to: '/guide/tutorial' }}
      next={{ label: 'Simulation component', to: '/guide/simulation-component' }}
    >
      <Content />
    </GuidePage>
  );
}
