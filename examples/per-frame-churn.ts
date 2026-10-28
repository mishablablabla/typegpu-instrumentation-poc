import { d, tgpu, type TgpuRoot } from 'typegpu';

const layout = tgpu.bindGroupLayout({ data: { storage: d.arrayOf(d.f32, 4), access: 'mutable' } });
const bump = tgpu.computeFn({ workgroupSize: [1] })(() => {
  'use gpu';
  layout.$.data[0] = (layout.$.data[0] as number) + 1;
});

/**
 * "Why does my frame time creep up and memory grow?" A render-loop shape with two classic mistakes: a new
 * pipeline every frame, and a scratch buffer per frame that is never destroyed. One steady pipeline in the
 * same loop is the control.
 */
export default async function scenario(root: TgpuRoot) {
  const shared = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage').$name('shared');
  const steady = root.createComputePipeline({ compute: bump }).$name('steady');
  const keep: unknown[] = []; // the application still references the leaked buffers
  for (let frame = 0; frame < 5; frame++) {
    const scratch = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage').$name('scratch');
    keep.push(scratch);
    const group = root.createBindGroup(layout, { data: scratch });
    steady.with(group).dispatchWorkgroups(1);
    // the mistake: a pipeline object per frame
    root
      .createComputePipeline({ compute: bump })
      .$name('perFrame')
      .with(root.createBindGroup(layout, { data: shared }))
      .dispatchWorkgroups(1);
  }
  console.log(`${keep.length} scratch buffers still referenced`);
}
