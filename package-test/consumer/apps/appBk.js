// Ak + opt-in. A with 'use gpu' kernels (needs the unplugin; used for the Vite configuration only).
import { d, tgpu } from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';

const layout = tgpu.bindGroupLayout({ data: { storage: d.arrayOf(d.f32, 8), access: 'mutable' } });
const compute = tgpu.computeFn({ workgroupSize: [8], in: { gid: d.builtin.globalInvocationId } })(({ gid }) => {
  'use gpu';
  layout.$.data[gid.x] = layout.$.data[gid.x] * 2;
});
const vertex = tgpu.vertexFn({ in: { idx: d.builtin.vertexIndex }, out: { pos: d.builtin.position } })(({ idx }) => {
  'use gpu';
  return { pos: d.vec4f(d.f32(idx) - 1, 0, 0, 1) };
});
const fragment = tgpu.fragmentFn({ out: d.vec4f })(() => {
  'use gpu';
  return d.vec4f(1, 0, 0, 1);
});

const root = await tgpu.init({ unstable_instrumentation: createInstrumentation({ historySize: 64 }) });
root['~unstable'].instrumentation?.subscribe((event) => console.log(event.type));
const data = root.createBuffer(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8]).$usage('storage');
const group = root.createBindGroup(layout, { data });
root.createComputePipeline({ compute }).with(group).dispatchWorkgroups(1);
const target = root.createTexture({ size: [16, 16], format: 'rgba8unorm' }).$usage('render');
root
  .createRenderPipeline({ vertex, fragment, targets: { format: 'rgba8unorm' } })
  .withColorAttachment({ view: target, loadOp: 'clear', storeOp: 'store' })
  .draw(3);
console.log(await data.read());
