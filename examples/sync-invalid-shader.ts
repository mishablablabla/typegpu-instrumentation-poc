import { tgpu, type TgpuRoot } from 'typegpu';

// Raw WGSL that does not compile, created through the SYNCHRONOUS entry point (what a first dispatch does).
const broken = tgpu.computeFn({ workgroupSize: [1] })`{ let x = definitelyUndeclared(1.0); }`;

/**
 * "Where is the error?" A synchronous pipeline creation cannot report whether it worked: the call returns
 * normally. The browser reports the problem later, as an uncaptured device error (on some browsers not at
 * all), and the compiler message that points at the line of the GENERATED WGSL comes from getCompilationInfo.
 */
export default async function scenario(root: TgpuRoot) {
  root.createComputePipeline({ compute: broken }).$name('brokenSync').initSync();
  console.log('initSync() returned normally');
}
