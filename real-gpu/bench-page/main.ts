/**
 * Browser overhead benchmark: the CPU-side cost of issuing TypeGPU operations against a real device.
 * It measures how long the JavaScript call takes (encoding and submitting), NOT how long the GPU takes:
 * the queue is drained between samples, outside the timed region. Batch sizes are chosen so that one batch
 * takes several milliseconds: the page timer ticks in 0.1 ms steps, so a batch of B calls resolves 0.1 ms / B per call.
 *
 * Only public TypeGPU API is used, so the same page is built against the pristine and the patched checkout.
 */
import { d, tgpu } from 'typegpu';
import { provenance } from './provenance.ts';

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
const vertexFull = tgpu.vertexFn({
  in: { idx: d.builtin.vertexIndex },
  out: { pos: d.builtin.position },
})(({ idx }) => {
  'use gpu';
  return { pos: d.vec4f(d.f32(idx & 1) * 4 - 1, d.f32(idx >> 1) * 4 - 1, 0, 1) };
});
const fragmentRed = tgpu.fragmentFn({ out: d.vec4f })(() => {
  'use gpu';
  return d.vec4f(1, 0, 0, 1);
});

type Options = { instrumentation: boolean; samples?: number; warmupBatches?: number };

const median = (xs: number[]) => xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)] as number;
const quantile = (xs: number[], q: number) =>
  xs.toSorted((a, b) => a - b)[Math.floor((xs.length - 1) * q)] as number;

export async function runBench(options: Options) {
  const prov = await provenance();
  if (prov.pageClassification === 'unavailable') {
    return { provenance: prov, ok: false, ops: {} };
  }
  const samples = options.samples ?? 40;
  const warmupBatches = options.warmupBatches ?? 8;

  // The option is ignored by a TypeGPU without the hook patch; `hasInstrumentation` records what happened.
  const root = await tgpu.init(
    options.instrumentation
      ? ({ unstable_instrumentation: { historySize: 256 } } as never)
      : undefined,
  );
  const hasInstrumentation =
    (root['~unstable'] as { instrumentation?: unknown }).instrumentation !== undefined;

  const data = root.createBuffer(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8]).$usage('storage');
  const factor = root.createBuffer(d.f32, 1).$usage('uniform');
  const uniform = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('uniform');
  const bindGroup = root.createBindGroup(layout, { data, factor });
  const compute = root.createComputePipeline({ compute: scale });
  compute.initSync();
  const target = root.createTexture({ size: [16, 16], format: 'rgba8unorm' }).$usage('render');
  const render = root.createRenderPipeline({
    vertex: vertexFull,
    fragment: fragmentRed,
    targets: { format: 'rgba8unorm' },
  });
  render.initSync();
  const attached = render.withColorAttachment({ view: target, loadOp: 'clear', storeOp: 'store' });
  const bound = compute.with(bindGroup);
  const values = [1, 2, 3, 4];

  const ops: Record<string, { batch: number; run: (n: number) => void }> = {
    // everything one dispatch costs: encoder, pass, bind groups, submit
    'dispatch (own encoder)': {
      batch: 2000,
      run: (n) => {
        for (let i = 0; i < n; i++) bound.dispatchWorkgroups(1);
      },
    },
    // isolates the per-call cost inside a pass that is already open (pass begin/end/submit amortised)
    'dispatch (open pass)': {
      batch: 50_000,
      run: (n) => {
        const encoder = root['~unstable'].createCommandEncoder();
        const pass = encoder.beginComputePass();
        const inPass = compute.with(pass).with(bindGroup);
        for (let i = 0; i < n; i++) inPass.dispatchWorkgroups(1);
        pass.end();
        encoder.submit();
      },
    },
    'draw (own encoder)': {
      batch: 2000,
      run: (n) => {
        for (let i = 0; i < n; i++) attached.draw(3);
      },
    },
    'buffer.write': {
      batch: 50_000,
      run: (n) => {
        for (let i = 0; i < n; i++) uniform.write(values);
      },
    },
  };

  const result: Record<
    string,
    {
      medianNs: number;
      p95Ns: number;
      minNs: number;
      maxNs: number;
      batch: number;
      samplesNs: number[];
    }
  > = {};
  for (const [name, { batch, run }] of Object.entries(ops)) {
    for (let i = 0; i < warmupBatches; i++) {
      run(batch);
      await root.device.queue.onSubmittedWorkDone();
    }
    const perOp: number[] = [];
    for (let s = 0; s < samples; s++) {
      const t0 = performance.now();
      run(batch);
      const t1 = performance.now();
      perOp.push(((t1 - t0) * 1e6) / batch);
      await root.device.queue.onSubmittedWorkDone(); // not timed
    }
    result[name] = {
      medianNs: median(perOp),
      p95Ns: quantile(perOp, 0.95),
      minNs: Math.min(...perOp),
      maxNs: Math.max(...perOp),
      batch,
      samplesNs: perOp,
    };
  }

  root.destroy();
  return {
    provenance: prov,
    ok: true,
    options,
    hasInstrumentation,
    samples,
    warmupBatches,
    timer:
      'performance.now() in the page (0.1 ms granularity): CPU time of the JavaScript calls only',
    ops: result,
  };
}

declare global {
  interface Window {
    runBench: typeof runBench;
  }
}
window.runBench = runBench;
