// Snippet of the documentation page: the debugging workflow (consumers are copied here by syncConsumer()).
// #region debug
import tgpu from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
import { attachConsoleReporter } from '../consumers/consoleReporter.ts';

const root = await tgpu.init({
  unstable_instrumentation: createInstrumentation(),
});
const inst = root['~unstable'].instrumentation;
if (!inst) {
  throw new Error('Instrumentation is not available');
}
attachConsoleReporter(inst);

// Raw WGSL that calls a function that does not exist.
const broken = tgpu.computeFn({ workgroupSize: [1] })`{ let x = definitelyUndeclared(1.0); }`;

try {
  await root.createComputePipeline({ compute: broken }).$name('broken').initAsync();
} catch {
  // The rejection says little. The events above say which pipeline failed and why.
}

// The WGSL TypeGPU generated, which is what the line numbers in the diagnostics refer to.
for (const failure of inst.getSnapshot().retainedFailures) {
  if (failure.type === 'pipeline-creation-failed') {
    console.log(failure.wgsl);
  }
}
// #endregion debug
