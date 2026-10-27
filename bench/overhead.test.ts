/**
 * Micro-benchmark of TypeGPU's own JS overhead on a plain-function mock device (no vi.fn, which records
 * every call and would dominate the measurement). Run by `scripts/bench.sh` once per configuration:
 *
 *   pristine  - upstream TypeGPU, no patch            (BENCH_INSTRUMENTATION unset)
 *   disabled  - patched TypeGPU, option not passed    (BENCH_INSTRUMENTATION unset)
 *   enabled   - patched TypeGPU, option passed        (BENCH_INSTRUMENTATION=1)
 *
 * It only uses TypeGPU's public API, so the identical file runs against all three trees.
 */
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
import { appendFileSync } from 'node:fs';
import { PerformanceObserver, constants } from 'node:perf_hooks';
import * as v8 from 'node:v8';
import * as vm from 'node:vm';
import { test } from 'vitest';
import { d, tgpu } from 'typegpu';

Object.assign(globalThis, {
  GPUBufferUsage: {
    MAP_READ: 1,
    MAP_WRITE: 2,
    COPY_SRC: 4,
    COPY_DST: 8,
    INDEX: 16,
    VERTEX: 32,
    UNIFORM: 64,
    STORAGE: 128,
    INDIRECT: 256,
    QUERY_RESOLVE: 512,
  },
});
Object.assign(globalThis, { GPUMapMode: { READ: 0, WRITE: 1 } });
Object.assign(globalThis, {
  GPUTextureUsage: {
    COPY_SRC: 1,
    COPY_DST: 2,
    TEXTURE_BINDING: 4,
    STORAGE_BINDING: 8,
    RENDER_ATTACHMENT: 16,
    TRANSIENT_ATTACHMENT: 32,
  },
});
Object.assign(globalThis, { GPUShaderStage: { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 } });

v8.setFlagsFromString('--expose-gc');
const gc = vm.runInNewContext('gc') as () => void;

const CONFIG = process.env.BENCH_CONFIG ?? 'unknown';
const ENABLED = process.env.BENCH_INSTRUMENTATION === '1';
const OUT = process.env.BENCH_OUT;
const SAMPLES = Number(process.env.BENCH_SAMPLES ?? 40);
const BATCH = Number(process.env.BENCH_BATCH ?? 20000);
const WARMUP = 5000;
const ALLOC_OPS = 200_000;

// --- plain mock device ---
const noop = () => {};
function makeDevice() {
  const computePass = {
    setPipeline: noop,
    setBindGroup: noop,
    dispatchWorkgroups: noop,
    dispatchWorkgroupsIndirect: noop,
    end: noop,
    setImmediates: noop,
  };
  const renderPass = {
    setPipeline: noop,
    setBindGroup: noop,
    setVertexBuffer: noop,
    setIndexBuffer: noop,
    setStencilReference: noop,
    draw: noop,
    drawIndexed: noop,
    end: noop,
    setImmediates: noop,
  };
  const encoder = {
    beginComputePass: () => computePass,
    beginRenderPass: () => renderPass,
    finish: () => ({}),
    clearBuffer: noop,
    copyBufferToBuffer: noop,
  };
  return {
    features: new Set<string>(),
    limits: {
      maxUniformBuffersPerShaderStage: 12,
      maxStorageBuffersPerShaderStage: 8,
      maxComputeWorkgroupStorageSize: 16384,
    },
    createBindGroup: () => ({}),
    createBindGroupLayout: () => ({}),
    createBuffer: ({ size, usage }: { size: number; usage: number }) => ({
      size,
      usage,
      mapState: 'unmapped',
      label: '',
      destroy: noop,
      getMappedRange: () => new ArrayBuffer(size),
      unmap: noop,
    }),
    createPipelineLayout: () => ({}),
    createShaderModule: () => ({}),
    createComputePipeline: () => ({}),
    createComputePipelineAsync: async () => ({}),
    createRenderPipeline: () => ({}),
    createRenderPipelineAsync: async () => ({}),
    createCommandEncoder: () => encoder,
    createTexture: () => ({ createView: () => ({}), destroy: noop }),
    createSampler: () => ({}),
    queue: {
      submit: noop,
      writeBuffer: noop,
      writeTexture: noop,
      onSubmittedWorkDone: () => Promise.resolve(),
    },
    destroy: noop,
  } as unknown as GPUDevice;
}

const layout = tgpu.bindGroupLayout({
  values: { storage: d.arrayOf(d.f32, 4), access: 'mutable' },
});
const computeMain = tgpu.computeFn({ workgroupSize: [1] })(() => {
  'use gpu';
  layout.$.values[0] = 1;
});
const vertexMain = tgpu.vertexFn({
  in: { idx: d.builtin.vertexIndex },
  out: { pos: d.builtin.position },
})(({ idx }) => {
  'use gpu';
  return { pos: d.vec4f(d.f32(idx), 0, 0, 1) };
});
const fragmentMain = tgpu.fragmentFn({ out: d.vec4f })(() => {
  'use gpu';
  return d.vec4f(1, 0, 0, 1);
});

function setup() {
  const device = makeDevice();
  const root = tgpu.initFromDevice(
    ENABLED ? ({ device, unstable_instrumentation: createInstrumentation() } as never) : { device },
  );
  const values = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage');
  const uniform = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('uniform');
  const bindGroup = root.createBindGroup(layout, { values });
  const compute = root.createComputePipeline({ compute: computeMain });
  compute.initSync();
  const texture = root.createTexture({ size: [16, 16], format: 'rgba8unorm' }).$usage('render');
  const render = root.createRenderPipeline({
    vertex: vertexMain,
    fragment: fragmentMain,
    targets: { format: 'rgba8unorm' },
  });
  render.initSync();
  const attached = render.withColorAttachment({ view: texture, loadOp: 'clear', storeOp: 'store' });
  const boundCompute = compute.with(bindGroup);
  const encoder = root['~unstable'].createCommandEncoder();
  const pass = encoder.beginComputePass();
  const boundToPass = compute.with(pass).with(bindGroup);
  const data = [1, 2, 3, 4];

  const ops: Record<string, () => void> = {
    // everything a dispatch costs: encoder, pass, bind groups, submit (all mocked)
    'dispatch (own encoder)': () => boundCompute.dispatchWorkgroups(1),
    // isolates the per-call hook cost: a dispatch recorded into an already-open pass
    'dispatch (open pass)': () => boundToPass.dispatchWorkgroups(1),
    'draw (own encoder)': () => attached.draw(3),
    'buffer.write': () => uniform.write(data),
  };
  return { root, ops };
}

function median(xs: number[]) {
  const s = xs.toSorted((a, b) => a - b);
  return s[Math.floor(s.length / 2)] as number;
}
const quantile = (xs: number[], q: number) =>
  xs.toSorted((a, b) => a - b)[Math.floor((xs.length - 1) * q)] as number;

test(`overhead [${CONFIG}]`, async () => {
  const { root, ops } = setup();
  const results: Record<string, unknown> = {};

  for (const [name, op] of Object.entries(ops)) {
    for (let i = 0; i < WARMUP; i++) op();
    gc();
    const perOp: number[] = [];
    for (let s = 0; s < SAMPLES; s++) {
      const t0 = performance.now();
      for (let i = 0; i < BATCH; i++) op();
      perOp.push(((performance.now() - t0) * 1e6) / BATCH);
    }

    // allocation proxy: number of garbage collections during a long fixed loop
    const kinds: number[] = [];
    const observer = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const gcEntry = e as unknown as { detail?: { kind?: number }; kind?: number };
        kinds.push(gcEntry.detail?.kind ?? gcEntry.kind ?? -1);
      }
    });
    observer.observe({ entryTypes: ['gc'] });
    gc();
    await new Promise((r) => setTimeout(r, 5));
    kinds.length = 0;
    const heapBefore = process.memoryUsage().heapUsed;
    for (let i = 0; i < ALLOC_OPS; i++) op();
    const heapGrowth = process.memoryUsage().heapUsed - heapBefore;
    await new Promise((r) => setTimeout(r, 20));
    observer.disconnect();

    results[name] = {
      medianNsPerOp: median(perOp),
      p10NsPerOp: quantile(perOp, 0.1),
      p90NsPerOp: quantile(perOp, 0.9),
      minorGcsPer200kOps: kinds.filter((k) => k === constants.NODE_PERFORMANCE_GC_MINOR).length,
      majorGcsPer200kOps: kinds.filter((k) => k !== constants.NODE_PERFORMANCE_GC_MINOR).length,
      heapGrowthBytesPer200kOps: heapGrowth,
    };
  }

  const inst = root['~unstable'].instrumentation;
  const record = {
    config: CONFIG,
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    samples: SAMPLES,
    batch: BATCH,
    ops: results,
    instrumentation: inst
      ? {
          historyLength: inst.history().length,
          eventsEmitted: inst.history().at(-1)?.seq ?? 0,
          droppedEvents: inst.getSnapshot().counters.droppedEvents,
          dispatchesCounted: inst.getSnapshot().pipelines.reduce((n, p) => n + p.dispatches, 0),
          drawsCounted: inst.getSnapshot().pipelines.reduce((n, p) => n + p.draws, 0),
        }
      : null,
  };
  if (OUT) appendFileSync(OUT, JSON.stringify(record) + '\n');
  else console.log(JSON.stringify(record, null, 2));
}, 600_000);
