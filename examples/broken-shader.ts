import { tgpu, type TgpuRoot } from 'typegpu';

// Raw WGSL calling a function that does not exist: the browser must reject it.
const broken = tgpu.computeFn({ workgroupSize: [1] })`{ let x = definitelyUndeclared(1.0); }`;

/** What the instrumentation shows for a pipeline that fails to compile. */
export default async function scenario(root: TgpuRoot) {
  try {
    await root.createComputePipeline({ compute: broken }).$name('broken').initAsync();
  } catch (error) {
    console.log(`initAsync rejected: ${(error as Error).message.split('\n')[0]}`);
  }
}
