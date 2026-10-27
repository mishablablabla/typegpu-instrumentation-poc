/**
 * Consumer: collects the event stream as JSON Lines text. It only builds strings: where they go
 * (a file in Node, a response body, the driver in the real-device harness) is the caller's decision,
 * so it works in any runtime. Nothing here touches the file system.
 *
 * Records, one JSON object per line, each with a `record` discriminator:
 *   {"record":"header","format":"typegpu-instrumentation-jsonl","version":1,"eventSchema":1}
 *   {"record":"event","event":{ ...exactly what the core emitted... }}
 *   {"record":"snapshot","afterSeq":N,"snapshot":{ ...getSnapshot() at that moment... }}
 * A caller may add its own records (for example `environment`) between lines.
 */
import type {
  TgpuInstrumentation,
  TgpuInstrumentationEvent,
} from '../../../src/core/instrumentation/types.ts';

type Source = Pick<TgpuInstrumentation, 'subscribe' | 'history' | 'getSnapshot'>;

export const JSONL_FORMAT = 'typegpu-instrumentation-jsonl';
export const JSONL_VERSION = 1;

export function createJsonlExport(source: Source) {
  const lines: string[] = [
    JSON.stringify({
      record: 'header',
      format: JSONL_FORMAT,
      version: JSONL_VERSION,
      eventSchema: 1,
    }),
  ];
  let lastSeq = 0;
  const addEvent = (event: TgpuInstrumentationEvent) => {
    lastSeq = event.seq;
    lines.push(JSON.stringify({ record: 'event', event }));
  };

  for (const event of source.history()) {
    addEvent(event);
  }
  const unsubscribe = source.subscribe(addEvent);

  return {
    /** Appends the current snapshot, tagged with the last event it is consistent with. */
    addSnapshot() {
      lines.push(
        JSON.stringify({ record: 'snapshot', afterSeq: lastSeq, snapshot: source.getSnapshot() }),
      );
    },
    lines: () => [...lines],
    /** The whole export, newline-terminated. */
    toString: () => `${lines.join('\n')}\n`,
    dispose: unsubscribe,
  };
}
