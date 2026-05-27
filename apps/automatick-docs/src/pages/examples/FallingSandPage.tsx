import { ExamplePage } from '../../layout/ExamplePage';
import { FallingSandDemo } from '../../demos/FallingSandDemo';

export function FallingSandPage() {
  return (
    <ExamplePage
      title='Falling Sand'
      description={
        <>
          <p>
            A cellular-automata sandbox where each material follows simple local
            movement rules. Sand falls and piles up, water flows sideways to fill
            containers, and stone stays put. The selected material rains from
            random positions along the top edge.
          </p>
          <p>
            Despite having only three materials and a handful of movement rules,
            the interactions produce surprisingly realistic behavior &mdash; sand
            forming natural angles of repose, water pooling behind obstacles, and
            layered sediment patterns.
          </p>
        </>
      }
    >
      <FallingSandDemo />
    </ExamplePage>
  );
}
