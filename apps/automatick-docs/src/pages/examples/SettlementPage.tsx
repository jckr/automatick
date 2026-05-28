import { ExamplePage } from '../../layout/ExamplePage';
import { SettlementDemo } from '../../demos/SettlementDemo';

export function SettlementPage() {
  return (
    <ExamplePage
      title='Settlement Growth'
      description={
        <>
          <p>
            Vagabonds (light circles) wander a landscape of renewable resources,
            depleting cells as they harvest &mdash; watch dark patches spread
            where they&apos;ve foraged. When a vagabond has gathered enough, it
            founds a settlement, provided no other settlement is too close;
            otherwise it joins a nearby one and becomes a settler (small colored
            squares clustered around their home).
          </p>
          <p>
            Settlements pay ongoing upkeep that scales with their population and
            buildings. Thriving ones spend surplus on new buildings; struggling
            ones can&apos;t feed everyone, so settlers emigrate &mdash; turning
            back into vagabonds and avoiding their old home for a while as they
            search for unclaimed ground. Settlements close enough to trade
            (gold lines) share resources, propping up poorer neighbors.
          </p>
          <p>
            The result is a boom-and-bust cycle: settlements grow, exhaust the
            local landscape, shed population, and the displaced go on to seed
            new colonies in fresh territory &mdash; all from local gathering,
            founding, and emigration rules.
          </p>
        </>
      }
    >
      <SettlementDemo />
    </ExamplePage>
  );
}
