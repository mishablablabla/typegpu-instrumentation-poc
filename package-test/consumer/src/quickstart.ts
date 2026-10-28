// The minimal example on the documentation page (site/). The page extracts the region between the
// `#region` markers verbatim, so what a reader copies is what was type-checked against the shipped .d.ts.
// #region quickstart
import tgpu from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';

const root = await tgpu.init({
  unstable_instrumentation: createInstrumentation(),
});

// `undefined` unless the option above was passed.
const inst = root['~unstable'].instrumentation;
if (!inst) {
  throw new Error('Instrumentation is not available');
}

inst.subscribe((event) => console.log(event.type, event));

// ...create buffers and pipelines, dispatch, draw...

console.log(inst.getSnapshot());
// #endregion quickstart
