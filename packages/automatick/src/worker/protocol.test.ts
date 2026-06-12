import { describe, expect, it } from 'vitest';
import type { MainToWorkerMessage } from './protocol';
import { deserializeMainMessage, serializeMainMessage } from './serialize';

/**
 * Wire round-trip coverage for the input message kind. The serialize helpers
 * are identity functions at runtime (postMessage's structured clone does the
 * real work), so the value here is type-level: these calls only compile if
 * `{ kind: 'input'; input }` is a well-formed `MainToWorkerMessage` on both
 * sides of the boundary.
 */
describe('worker protocol: input messages', () => {
  type Stroke = { x: number; y: number };

  it('the input message kind round-trips through the serialization boundary', () => {
    const msg: MainToWorkerMessage<{ brushSize: number }, Stroke> = {
      kind: 'input',
      input: { x: 3, y: 7 },
    };
    const roundTripped = deserializeMainMessage<{ brushSize: number }, Stroke>(
      serializeMainMessage(msg)
    );
    expect(roundTripped).toEqual(msg);
    if (roundTripped.kind === 'input') {
      expect(roundTripped.input).toEqual({ x: 3, y: 7 });
    } else {
      throw new Error('expected an input message');
    }
  });

  it('maxQueuedInputs rides in the init config', () => {
    const msg: MainToWorkerMessage<{ brushSize: number }, Stroke> = {
      kind: 'init',
      params: { brushSize: 4 },
      seed: 42,
      config: { maxQueuedInputs: 256 },
    };
    const roundTripped = deserializeMainMessage<{ brushSize: number }, Stroke>(
      serializeMainMessage(msg)
    );
    expect(roundTripped).toEqual(msg);
  });
});
