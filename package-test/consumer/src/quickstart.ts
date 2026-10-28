// The quick start shown on the documentation page (site/). The page extracts the region between the
// `#region` markers verbatim, so what a reader copies is what was type-checked against the shipped .d.ts.
// #region quickstart
import tgpu from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';

export async function main() {
  // 1. Opt in explicitly: nothing is observed unless this option is passed.
  const root = await tgpu.init({
    unstable_instrumentation: createInstrumentation({
      historySize: 256, // newest events kept (default 256)
      historyMaxBytes: 4 * 1024 * 1024, // estimated payload cap (default 4 MiB)
      captureSource: true, // keep the generated WGSL in events (default true)
    }),
  });

  // 2. The facade is undefined when the option was not passed.
  const inst = root['~unstable'].instrumentation;
  if (!inst) return;

  // 3. Events arrive synchronously, in `seq` order.
  const unsubscribe = inst.subscribe((event) => {
    if (event.type === 'pipeline-creation-failed') {
      console.warn(event.phase, event.trigger, event.message);
    }
  });

  // 4. Or pull what is alive right now, plus the most recent history.
  const snapshot = inst.getSnapshot();
  console.log(snapshot.counters, inst.history().length);

  // 5. Clean up. `dispose()` is permanent; history and snapshot stay readable.
  unsubscribe();
  inst.dispose();
}
// #endregion quickstart
