import { ExamplePage } from '../../layout/ExamplePage';
import { SettlementDemo } from '../../demos/SettlementDemo';

export function SettlementPage() {
  return (
    <ExamplePage
      title='Settlement Growth'
      description={
        <>
          <p>
            Agents wander a landscape of renewable resources, gathering as they
            go. When an agent accumulates enough, it founds a settlement &mdash;
            or joins a nearby one. Settlements spend stored resources to erect
            buildings, and nearby wanderers are gradually attracted to join.
          </p>
          <p>
            Cities, trade proximity lines, and population concentration all
            emerge from individual-level gathering and founding decisions.
            Faint lines connect settlements that are close enough to trade.
          </p>
        </>
      }
    >
      <SettlementDemo />
    </ExamplePage>
  );
}
