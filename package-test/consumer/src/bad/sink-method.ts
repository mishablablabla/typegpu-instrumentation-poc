import tgpu from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
const root = await tgpu.init({ unstable_instrumentation: createInstrumentation() });
// sink-only method (hook-site API) must not be visible on the public interface
root['~unstable'].instrumentation?.bufferMaterialized({}, {} as GPUBufferDescriptor);
