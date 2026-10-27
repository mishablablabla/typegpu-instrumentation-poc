// D: C plus an import of the entry whose binding is never referenced (sideEffects:false must let bundlers drop the hub).
import { tgpu } from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';

console.log(await tgpu.init());
