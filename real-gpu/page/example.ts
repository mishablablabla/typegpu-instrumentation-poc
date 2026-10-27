/**
 * Runs a user scenario (`export default async (root) => …`) on a real device with instrumentation on,
 * prints the events through the console reporter and returns the JSONL lines for the driver to write.
 * Registered as `window.runExample` by main.ts; used by `real-gpu/run.mjs --example`.
 */
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
import example from 'example-under-test';
import { tgpu } from 'typegpu';
import { attachConsoleReporter } from '../consumers/consoleReporter.ts';
import { createJsonlExport } from '../consumers/jsonlExport.ts';
import { requireInstrumentation } from '../consumers/requireInstrumentation.ts';
import { provenance } from './provenance.ts';

export const REPORT_PREFIX = '[typegpu-instrumentation] ';
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runExample() {
  const prov = await provenance();
  if (prov.pageClassification === 'unavailable') {
    return { provenance: prov, jsonl: [] as string[], error: null };
  }

  const root = await tgpu.init({
    unstable_instrumentation: createInstrumentation({ historySize: 512 }),
  });
  const instrumentation = requireInstrumentation(root);
  const reporter = attachConsoleReporter(instrumentation, {
    log: (line) => console.log(`${REPORT_PREFIX}${line}`),
  });
  const exported = createJsonlExport(instrumentation);

  let error: string | null = null;
  try {
    await example(root);
    // Compiler diagnostics and queue work settle asynchronously.
    await root.device.queue.onSubmittedWorkDone();
    await sleep(150);
  } catch (caught) {
    error = `${(caught as Error).name}: ${(caught as Error).message}`;
  }

  reporter.printSnapshot();
  exported.addSnapshot();

  // Tear down: shows what the scenario left alive, and the loss of the device the root owns.
  root.destroy();
  for (let i = 0; i < 40 && !instrumentation.history().some((e) => e.type === 'device-lost'); i++) {
    await sleep(50);
  }
  reporter.dispose();
  exported.dispose();
  return { provenance: prov, jsonl: exported.lines(), error };
}
