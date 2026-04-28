import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { SegregationLocalDemo } from '../../demos/SegregationLocalDemo';

export function SegregationLocalPage() {
  return (
    <ExamplePage
      title='Segregation (local, no worker)'
      description={
        <>
          <p>
            Same business logic module as the worker version, but rendered and
            stepped on the main thread.
          </p>
          <p>
            A local variant of Schelling&apos;s segregation model, running on
            the main thread.
          </p>
        </>
      }
    >
      <SegregationLocalDemo />
    </ExamplePage>
  );
}
