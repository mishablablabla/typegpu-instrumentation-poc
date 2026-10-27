import tgpu from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
const root = await tgpu.init({ unstable_instrumentation: createInstrumentation() });
root['~unstable'].instrumentation?.subscribe((event) => {
  if (event.type === 'pipeline-compiled') console.log(event);
});
