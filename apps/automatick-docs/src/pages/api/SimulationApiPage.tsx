import React from 'react';
import { ApiPage } from '../../layout/ApiPage';
import Content from './simulation.mdx';

export function SimulationApiPage() {
  return (
    <ApiPage kind='component' module='automatick/react/simulation'>
      <Content />
    </ApiPage>
  );
}
