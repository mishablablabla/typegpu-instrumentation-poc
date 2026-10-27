import tgpu from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
await tgpu.init({ unstable_instrumentation: createInstrumentation });
