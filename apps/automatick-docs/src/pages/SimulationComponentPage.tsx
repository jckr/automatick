import React from 'react';
import { GuidePage } from '../layout/GuidePage';
import Content from './simulation-component.mdx';

export function SimulationComponentPage() {
  return (
    <GuidePage
      crumbs={[
        { label: 'Guide', to: '/guide/getting-started' },
        { label: 'Simulation component' },
      ]}
      prev={{ label: 'Defining a simulation', to: '/guide/defining-a-sim' }}
      next={{ label: 'Using the hook', to: '/guide/using-the-hook' }}
    >
      <Content />
    </GuidePage>
  );
}
