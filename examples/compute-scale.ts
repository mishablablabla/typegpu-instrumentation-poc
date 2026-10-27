import { d, tgpu, type TgpuRoot } from 'typegpu';

const layout = tgpu.bindGroupLayout({
  data: { storage: d.arrayOf(d.f32, 8), access: 'mutable' },
  factor: { uniform: d.f32 },
});

const scale = tgpu.computeFn({ workgroupSize: [8], in: { gid: d.builtin.globalInvocationId } })(({
  gid,
}) => {
  'use gpu';
  layout.$.data[gid.x] = (layout.$.data[gid.x] as number) * layout.$.factor;
});

/**
 * An ordinary TypeGPU program. It does not know about instrumentation: whoever runs it
 * (real-gpu/run.mjs --example) creates the root with instrumentation switched on.
 */
export default async function scenario(root: TgpuRoot) {
  const data = root
    .createBuffer(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8])
    .$usage('storage')
    .$name('data');
  const factor = root.createBuffer(d.f32).$usage('uniform').$name('factor');
  const bindGroup = root.createBindGroup(layout, { data, factor });
  const pipeline = root.createComputePipeline({ compute: scale }).$name('scale');

  factor.write(3);
  pipeline.with(bindGroup).dispatchWorkgroups(1); // first use: the pipeline is compiled here
  console.log(`result after x3: ${JSON.stringify(await data.read())}`);

  factor.write(10);
  pipeline.with(bindGroup).dispatchWorkgroups(1);
  console.log(`result after x10: ${JSON.stringify(await data.read())}`);

  data.destroy(); // `factor` is deliberately left alive
}
