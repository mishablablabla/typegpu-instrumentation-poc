// B: identical to A plus the opt-in (3 changed lines: import, option, subscribe).
import tgpu, { d } from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';

const root = await tgpu.init({ unstable_instrumentation: createInstrumentation({ historySize: 64 }) });
root['~unstable'].instrumentation?.subscribe((event) => console.log(event.type));
const data = root.createMutable(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8]);
const compute = tgpu.computeFn({ workgroupSize: [8], in: { gid: d.builtin.globalInvocationId } })(
  '{ data[gid.x] = data[gid.x] * 2f; }',
).$uses({ data });
const pipeline = root.createComputePipeline({ compute });
pipeline.dispatchWorkgroups(1);
console.log(await data.read());
