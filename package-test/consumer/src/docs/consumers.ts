// Snippet of the documentation page: the ready-made consumers, copied from consumers/ into src/consumers/ by syncConsumer().
// #region consumers
import type { TgpuInstrumentation } from 'typegpu/unstable-instrumentation';
import { attachConsoleReporter } from '../consumers/consoleReporter.ts';
import { createJsonlExport } from '../consumers/jsonlExport.ts';
import { parseJsonl } from '../consumers/jsonlRead.ts';

export function consume(inst: TgpuInstrumentation) {
  // One line per event, history first.
  const reporter = attachConsoleReporter(inst, { prefix: '[tgpu] ' });
  reporter.printSnapshot();

  // JSON Lines text: a header, one record per event, a snapshot when asked.
  const jsonl = createJsonlExport(inst);
  jsonl.addSnapshot();
  const text = jsonl.toString();

  // Reading it back rejects files and events of a schema version it does not know.
  const { events } = parseJsonl(text);
  console.log(events.length, 'events');

  reporter.dispose();
  jsonl.dispose();
}
// #endregion consumers
