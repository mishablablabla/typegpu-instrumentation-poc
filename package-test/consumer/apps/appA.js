// A: root + buffer + compute pipeline (callback-free: WGSL template, no 'use gpu' kernels, so every bundler can build it
// without the TypeGPU unplugin). Never imports typegpu/unstable-instrumentation.
import tgpu, { d } from 'typegpu';

const root = await tgpu.init();
const data = root.createMutable(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8]);
const compute = tgpu.computeFn({ workgroupSize: [8], in: { gid: d.builtin.globalInvocationId } })(
  '{ data[gid.x] = data[gid.x] * 2f; }',
).$uses({ data });
const pipeline = root.createComputePipeline({ compute });
pipeline.dispatchWorkgroups(1);
console.log(await data.read());
