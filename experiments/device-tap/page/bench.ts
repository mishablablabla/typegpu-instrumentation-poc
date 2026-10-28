/**
 * CPU-side overhead of the device tap: the same operations on three devices in ONE page, one per
 * configuration (plain, tap-lite = no encoder/pass wrapping, tap-full), samples interleaved round-robin with a
 * rotating order. Measures how long the JavaScript calls take, NOT GPU execution: the queue is drained between
 * samples, outside the timed region. Resolution: performance.now() ticks 0.1 ms, batches are sized to take ms.
 */
import { d, tgpu } from 'typegpu';
import { type DeviceTap, tapDevice } from '../src/deviceTap.ts';
import { provenance } from '../../real-gpu/page/provenance.ts';

const layout = tgpu.bindGroupLayout({
  data: { storage: d.arrayOf(d.f32, 8), access: 'mutable' },
  factor: { uniform: d.f32 },
});
const scale = tgpu.computeFn({ workgroupSize: [8], in: { gid: d.builtin.globalInvocationId } })(({ gid }) => {
  'use gpu';
  layout.$.data[gid.x] = (layout.$.data[gid.x] as number) * layout.$.factor;
});

const median = (xs: number[]) => xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)] as number;
const quantile = (xs: number[], q: number) => xs.toSorted((a, b) => a - b)[Math.floor((xs.length - 1) * q)] as number;
const WGSL = '@compute @workgroup_size(1) fn main() {}';

type Cfg = 'plain' | 'tap-lite' | 'tap-full' | 'tap-full-nostrip';
type Ctx = {
  name: Cfg;
  device: GPUDevice;
  tap: DeviceTap | null;
  rawPipeline: GPUComputePipeline;
  root: ReturnType<typeof tgpu.initFromDevice>;
  uniform: GPUBuffer;
  tgpuBound: any;
  tgpuCompute: any;
  tgpuBindGroup: any;
  tgpuUniform: any;
};

async function makeCtx(name: Cfg): Promise<Ctx> {
  const device = await (await navigator.gpu.requestAdapter())!.requestDevice();
  const tap = name === 'plain' ? null : tapDevice(device, { historySize: 256, passes: name.startsWith('tap-full'), stripTransient: name !== 'tap-full-nostrip' });
  const rawPipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: WGSL }), entryPoint: 'main' } });
  const uniform = device.createBuffer({ size: 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM });
  const root = tgpu.initFromDevice({ device });
  const data = root.createBuffer(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8]).$usage('storage');
  const factor = root.createBuffer(d.f32, 1).$usage('uniform');
  const tgpuUniform = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('uniform');
  const tgpuBindGroup = root.createBindGroup(layout, { data, factor });
  const tgpuCompute = root.createComputePipeline({ compute: scale });
  tgpuCompute.initSync();
  return { name, device, tap, rawPipeline, root, uniform, tgpuBound: tgpuCompute.with(tgpuBindGroup), tgpuCompute, tgpuBindGroup, tgpuUniform };
}

type Op = { batch: number; run: (c: Ctx, n: number) => void; prepare?: (c: Ctx, n: number) => () => void };
const f4 = new Float32Array(4);
const values = [1, 2, 3, 4];

const ops: Record<string, Op> = {
  // raw WebGPU calls
  'raw createBuffer': {
    batch: 2000,
    run: () => {},
    prepare: (c, n) => {
      const keep: GPUBuffer[] = new Array(n);
      return Object.assign(() => { for (let i = 0; i < n; i++) keep[i] = c.device.createBuffer({ size: 256, usage: GPUBufferUsage.UNIFORM }); }, { cleanup: () => keep.forEach((b) => b.destroy()) });
    },
  },
  'raw buffer.destroy': {
    batch: 8000,
    run: () => {},
    prepare: (c, n) => {
      const keep = Array.from({ length: n }, () => c.device.createBuffer({ size: 256, usage: GPUBufferUsage.UNIFORM }));
      return () => { for (let i = 0; i < n; i++) keep[i]!.destroy(); };
    },
  },
  'raw dispatch in open pass': {
    batch: 50_000,
    run: () => {},
    prepare: (c, n) => {
      const enc = c.device.createCommandEncoder();
      const pass = enc.beginComputePass();
      pass.setPipeline(c.rawPipeline);
      return Object.assign(() => { for (let i = 0; i < n; i++) pass.dispatchWorkgroups(1); }, { cleanup: () => { pass.end(); c.device.queue.submit([enc.finish()]); } });
    },
  },
  'raw encoder+pass+dispatch+end+finish+submit': {
    batch: 2000,
    run: (c, n) => {
      const q = c.device.queue;
      for (let i = 0; i < n; i++) {
        const enc = c.device.createCommandEncoder();
        const pass = enc.beginComputePass();
        pass.setPipeline(c.rawPipeline);
        pass.dispatchWorkgroups(1);
        pass.end();
        q.submit([enc.finish()]);
      }
    },
  },
  'raw queue.writeBuffer (16 B)': {
    batch: 50_000,
    run: (c, n) => { const q = c.device.queue; for (let i = 0; i < n; i++) q.writeBuffer(c.uniform, 0, f4); },
  },
  'raw queue.submit (prebuilt cb)': {
    batch: 1000,
    run: () => {},
    prepare: (c, n) => {
      const cbs = Array.from({ length: n }, () => { const e = c.device.createCommandEncoder(); e.beginComputePass().end(); return e.finish(); });
      return () => { const q = c.device.queue; for (let i = 0; i < n; i++) q.submit([cbs[i]!]); };
    },
  },
  // the same through TypeGPU (initFromDevice on the tapped device)
  'tgpu dispatch (own encoder)': { batch: 2000, run: (c, n) => { for (let i = 0; i < n; i++) c.tgpuBound.dispatchWorkgroups(1); } },
  'tgpu dispatch (open pass)': {
    batch: 50_000,
    run: (c, n) => {
      const encoder = c.root['~unstable'].createCommandEncoder();
      const pass = encoder.beginComputePass();
      const inPass = c.tgpuCompute.with(pass).with(c.tgpuBindGroup);
      for (let i = 0; i < n; i++) inPass.dispatchWorkgroups(1);
      pass.end();
      encoder.submit();
    },
  },
  'tgpu buffer.write': { batch: 50_000, run: (c, n) => { for (let i = 0; i < n; i++) c.tgpuUniform.write(values); } },
};

export async function runBenchAlt(options: { samples?: number; warmupBatches?: number; rotate?: number } = {}) {
  const prov = await provenance();
  if (prov.pageClassification === 'unavailable') return { provenance: prov, ok: false, ops: {} };
  const samples = options.samples ?? 30;
  const warmup = options.warmupBatches ?? 4;
  const names: Cfg[] = ['plain', 'tap-lite', 'tap-full', 'tap-full-nostrip'];
  const ctxs = await Promise.all(names.map(makeCtx));
  const result: Record<string, Record<string, { medianNs: number; p95Ns: number; samplesNs: number[] }>> = {};

  const timeOnce = async (c: Ctx, op: Op, measure: boolean): Promise<number> => {
    const n = op.batch;
    let ns = 0;
    if (op.prepare) {
      const fn = op.prepare(c, n) as (() => void) & { cleanup?: () => void };
      const t0 = performance.now();
      fn();
      const t1 = performance.now();
      fn.cleanup?.();
      ns = ((t1 - t0) * 1e6) / n;
    } else {
      const t0 = performance.now();
      op.run(c, n);
      const t1 = performance.now();
      ns = ((t1 - t0) * 1e6) / n;
    }
    await c.device.queue.onSubmittedWorkDone(); // not timed
    return measure ? ns : 0;
  };

  for (const [opName, op] of Object.entries(ops)) {
    const per: Record<string, number[]> = Object.fromEntries(names.map((n) => [n, []]));
    for (let w = 0; w < warmup; w++) for (const c of ctxs) await timeOnce(c, op, false);
    for (let s = 0; s < samples; s++) {
      // rotate the order within the page every sample so no configuration is always first/last
      for (let k = 0; k < ctxs.length; k++) {
        const c = ctxs[(s + k + (options.rotate ?? 0)) % ctxs.length]!;
        per[c.name]!.push(await timeOnce(c, op, true));
      }
    }
    result[opName] = Object.fromEntries(names.map((n) => [n, { medianNs: median(per[n]!), p95Ns: quantile(per[n]!, 0.95), samplesNs: per[n]! }]));
  }
  const tapCounters = Object.fromEntries(ctxs.filter((c) => c.tap).map((c) => [c.name, (c.tap!.snapshot() as any).counters]));
  for (const c of ctxs) { c.tap?.restore(); c.device.destroy(); }
  return { provenance: prov, ok: true, samples, warmup, rotate: options.rotate ?? 0, timer: 'performance.now() CPU time of JS calls only; queue drained outside timing', ops: result, tapCounters };
}
(window as any).runBenchAlt = runBenchAlt;
