import React from 'react';
import { ExamplePage } from '../../layout/ExamplePage';
import { EMFieldDemo } from '../../demos/EMFieldDemo';

export function EMFieldPage() {
  return (
    <ExamplePage
      title='Electric Field'
      description={
        <>
          <p>
            Point charges and the electrostatic field they create. The
            background is the electric <em>potential</em> (red for positive,
            blue for negative), and the white curves are field lines streaming
            out of positive charges and into negative ones. Charge size scales
            with magnitude.
          </p>
          <p>
            By default the charges are fixed, so you can explore a static field
            — add or remove charges and watch the potential and field lines
            redraw. Turn off <strong>Fixed charges</strong> to let them move:
            each charge accelerates under the combined Coulomb force of all the
            others (like repels, opposite attracts), so they spiral, scatter,
            and settle into low-energy arrangements.
          </p>
        </>
      }
    >
      <EMFieldDemo />
    </ExamplePage>
  );
}
