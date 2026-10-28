import { d, tgpu, type TgpuRoot } from 'typegpu';

const layout = tgpu.bindGroupLayout({ out: { storage: d.arrayOf(d.f32, 4), access: 'mutable' } });

// A slot without a default that nobody fills: TypeGPU cannot generate the shader.
const multiplier = tgpu.slot<number>();
const kernel = tgpu.computeFn({ workgroupSize: [1] })(() => {
  'use gpu';
  layout.$.out[0] = multiplier.$;
});

/**
 * "Why does nothing run?" The failure happens while TypeGPU generates WGSL, before WebGPU is involved: the
 * browser never sees a shader, so there is no device error and no compiler message, only the thrown error.
 */
export default async function scenario(root: TgpuRoot) {
  const out = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage');
  const group = root.createBindGroup(layout, { out });
  try {
    root
      .createComputePipeline({ compute: kernel })
      .$name('needsSlot')
      .with(group)
      .dispatchWorkgroups(1);
  } catch (error) {
    console.log(`dispatch threw ${(error as Error).constructor.name}`);
  }
}
