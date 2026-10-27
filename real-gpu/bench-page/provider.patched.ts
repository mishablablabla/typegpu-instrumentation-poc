// Build-time variant for checkouts that contain the instrumentation layer (see build.mjs).
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
import { attachConsoleReporter } from '../consumers/consoleReporter.ts';
import { createJsonlExport } from '../consumers/jsonlExport.ts';

export type Subscriber = 'none' | 'noop' | 'console-stub' | 'console-real' | 'jsonl';

export const available = true;
export const makeProvider = (options: {
  historySize?: number | undefined;
  captureSource?: boolean | undefined;
}) => createInstrumentation(options);

type Source = Parameters<typeof attachConsoleReporter>[0];

/** Attaches the requested consumer; returns what it collected so the benchmark can prove it did work. */
export function attachSubscriber(kind: Subscriber, source: Source) {
  switch (kind) {
    case 'none':
      return { count: () => 0 };
    case 'noop': {
      let n = 0;
      source.subscribe(() => void n++);
      return { count: () => n };
    }
    case 'console-stub': {
      let n = 0;
      attachConsoleReporter(source, { log: () => void n++, replayHistory: false });
      return { count: () => n };
    }
    case 'console-real': {
      let n = 0;
      attachConsoleReporter(source, {
        log: (line) => (n++, console.log(line)),
        replayHistory: false,
      });
      return { count: () => n };
    }
    case 'jsonl': {
      const jsonl = createJsonlExport(source);
      return { count: () => jsonl.lines().length - 1 };
    }
  }
}
