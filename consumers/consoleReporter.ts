/**
 * Consumer: prints every event as one readable line, as it happens. The instrumentation core never
 * prints; this is the only place that decides where lines go (`console.log` by default).
 */
import type { TgpuInstrumentation } from '../../../src/core/instrumentation/types.ts';
import { formatEvent, formatSnapshot } from './textReport.ts';

type Source = Pick<TgpuInstrumentation, 'subscribe' | 'history' | 'getSnapshot'>;

export type ConsoleReporterOptions = {
  /** Where lines go. @default console.log */
  log?: (line: string) => void;
  /** Prepended to every line. @default '' */
  prefix?: string;
  /** Print the events that happened before this call too. @default true */
  replayHistory?: boolean;
};

export function attachConsoleReporter(source: Source, options: ConsoleReporterOptions = {}) {
  const { log = (line: string) => console.log(line), prefix = '', replayHistory = true } = options;
  const print = (line: string) => log(`${prefix}${line}`);

  if (replayHistory) {
    for (const event of source.history()) {
      print(formatEvent(event));
    }
  }
  const unsubscribe = source.subscribe((event) => print(formatEvent(event)));

  return {
    /** Prints a summary of what is alive now, plus what this layer cannot tell. */
    printSnapshot() {
      for (const line of formatSnapshot(source.getSnapshot())) {
        print(line);
      }
    },
    dispose: unsubscribe,
  };
}
