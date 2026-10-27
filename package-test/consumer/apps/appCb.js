// C + opt-in: the smallest possible opted-in use; (Cb - C) is the fixed cost of the hub.
import { tgpu } from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';

console.log(await tgpu.init({ unstable_instrumentation: createInstrumentation() }));
