/**
 * Browser overhead benchmark: the CPU-side cost of issuing TypeGPU operations against a real device.
 * It measures how long the JavaScript calls take (encoding and submitting), NOT how long the GPU takes:
 * the queue is drained between samples, outside the timed region.
 *
 * One page, many configurations (chosen by the driver, one fresh browser process per run). Only public TypeGPU
 * API is used besides `./provider.ts`, which the build swaps so that the identical page also runs against the
 * pristine checkout.
 *
 * The page is served cross-origin isolated, which makes `performance.now()` fine-grained (about 5 µs instead
 * of 0.1 ms); the achieved granularity is measured and recorded, not assumed.
 */
import { d, tgpu } from 'typegpu';
import { provenance } from './provenance.ts';
import { attachSubscriber, available, makeProvider, type Subscriber } from './provider.ts';

declare const __PADDING__: string;
// Referenced so that the rebuilt A/A copies really differ in their code.
const padding: string = __PADDING__;

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

export type BenchConfig = {
  /** `null`: do not request instrumentation. */
  instrumentation: null | {
    historySize?: number;
    captureSource?: boolean;
    subscriber: Subscriber;
  };
  ops?: string[];
  samples?: number;
  warmupBatches?: number;
};

type OpDef = {
  kind: 'hot' | 'cold';
  batch: number;
  /** Events one iteration emits when instrumentation is on; 0 for counter-only operations. */
  eventsPerIteration: number;
  run: (n: number) => void;
};

const sorted = (xs: number[]) => xs.toSorted((a, b) => a - b);
const median = (xs: number[]) => sorted(xs)[Math.floor(xs.length / 2)] as number;
const quantile = (xs: number[], q: number) => sorted(xs)[Math.floor((xs.length - 1) * q)] as number;

/** A fixed pure-JS loop: a per-process CPU-speed probe, to flag contaminated processes afterwards. */
function calibrationNs(): number {
  let acc = 0;
  const t0 = performance.now();
  for (let i = 0; i < 20_000_000; i++) {
    acc = (acc + i * 31) | 0;
  }
  const t1 = performance.now();
  if (acc === 42) {
    console.log('unreachable');
  }
  return ((t1 - t0) * 1e6) / 20_000_000;
}

/** Smallest positive difference between consecutive `performance.now()` readings (the real tick size). */
function timerTickMs(): number {
  let smallest = Number.POSITIVE_INFINITY;
  let last = performance.now();
  for (let i = 0; i < 200_000 && smallest > 0.001; i++) {
    const now = performance.now();
    if (now > last) {
      smallest = Math.min(smallest, now - last);
      last = now;
    }
  }
  return smallest;
}

const heapBytes = () =>
  (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ??
  null;

export async function runBench(config: BenchConfig) {
  const prov = await provenance();
  if (prov.pageClassification === 'unavailable') {
    return { provenance: prov, ok: false, ops: {} };
  }
  const samples = config.samples ?? 60;
  const warmupBatches = config.warmupBatches ?? 8;
  const calibrationBefore = calibrationNs();
  const tickMs = timerTickMs();

  const requested = config.instrumentation;
  const root = await tgpu.init(
    requested
      ? ({
          unstable_instrumentation: makeProvider({
            historySize: requested.historySize,
            captureSource: requested.captureSource,
          }),
        } as never)
      : undefined,
  );
  const inst = (
    root['~unstable'] as unknown as {
      instrumentation?: {
        getSnapshot(): {
          pipelines: readonly { dispatches: number }[];
          counters: { droppedEvents: number; listenerErrors: number };
        };
        history(): readonly { seq: number }[];
      };
    }
  ).instrumentation;
  const hasInstrumentation = inst !== undefined;
  const subscriber =
    inst && requested ? attachSubscriber(requested.subscriber, inst as never) : null;
  const emittedEvents = () => {
    if (!inst) {
      return 0;
    }
    const snapshot = inst.getSnapshot();
    return snapshot.counters.droppedEvents + inst.history().length;
  };
  const dispatchesCounted = () =>
    inst?.getSnapshot().pipelines.reduce((sum, p) => sum + p.dispatches, 0) ?? 0;

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

  const ops: Record<string, OpDef> = {
    // The per-call cost inside a pass that is already open (pass begin/end/submit amortised).
    'dispatch (open pass)': {
      kind: 'hot',
      batch: 100_000,
      eventsPerIteration: 0,
      run: (n) => {
        const encoder = root['~unstable'].createCommandEncoder();
        const pass = encoder.beginComputePass();
        const inPass = compute.with(pass).with(bindGroup);
        for (let i = 0; i < n; i++) inPass.dispatchWorkgroups(1);
        pass.end();
        encoder.submit();
      },
    },
    'buffer.write': {
      kind: 'hot',
      batch: 100_000,
      eventsPerIteration: 0,
      run: (n) => {
        for (let i = 0; i < n; i++) uniform.write(values);
      },
    },
    // Everything one dispatch/draw costs: encoder, pass, bind groups, submit.
    'dispatch (own encoder)': {
      kind: 'hot',
      batch: 4000,
      eventsPerIteration: 0,
      run: (n) => {
        for (let i = 0; i < n; i++) bound.dispatchWorkgroups(1);
      },
    },
    'draw (own encoder)': {
      kind: 'hot',
      batch: 4000,
      eventsPerIteration: 0,
      run: (n) => {
        for (let i = 0; i < n; i++) attached.draw(3);
      },
    },
    // Event-emitting operations: what a developer pays when the layer actually produces events.
    'buffer create+destroy': {
      kind: 'cold',
      batch: 400,
      eventsPerIteration: 2,
      run: (n) => {
        for (let i = 0; i < n; i++) {
          const buffer = root.createBuffer(d.f32).$usage('uniform');
          root.unwrap(buffer);
          buffer.destroy();
        }
      },
    },
    'bind group create': {
      kind: 'cold',
      batch: 400,
      eventsPerIteration: 1,
      run: (n) => {
        for (let i = 0; i < n; i++) {
          root.unwrap(root.createBindGroup(layout, { data, factor }));
        }
      },
    },
    'pipeline create (sync)': {
      kind: 'cold',
      batch: 20,
      eventsPerIteration: 1,
      run: (n) => {
        for (let i = 0; i < n; i++) {
          root.createComputePipeline({ compute: scale }).initSync();
        }
      },
    },
  };

  const selected = config.ops ?? Object.keys(ops);
  const gc = (globalThis as { gc?: () => void }).gc;
  const result: Record<
    string,
    {
      kind: string;
      batch: number;
      samplesNs: number[];
      medianNs: number;
      p95Ns: number;
      heapBefore: number | null;
      heapAfter: number | null;
      /** Did the configuration really do the work it claims? (counters advanced / events emitted) */
      verified: boolean | null;
      emittedEvents: number;
      subscriberSaw: number;
    }
  > = {};

  for (const name of selected) {
    const op = ops[name];
    if (op === undefined) {
      continue;
    }
    for (let i = 0; i < warmupBatches; i++) {
      op.run(op.batch);
      await root.device.queue.onSubmittedWorkDone();
    }
    gc?.();
    await root.device.queue.onSubmittedWorkDone();

    const eventsBefore = emittedEvents();
    const dispatchesBefore = dispatchesCounted();
    const subscriberBefore = subscriber?.count() ?? 0;
    const heapBefore = heapBytes();
    const perOp: number[] = [];
    for (let s = 0; s < samples; s++) {
      const t0 = performance.now();
      op.run(op.batch);
      const t1 = performance.now();
      perOp.push(((t1 - t0) * 1e6) / op.batch);
      await root.device.queue.onSubmittedWorkDone(); // not timed
    }
    const heapAfter = heapBytes();

    const emitted = emittedEvents() - eventsBefore;
    let verified: boolean | null = null;
    if (hasInstrumentation) {
      if (name === 'dispatch (open pass)') {
        verified = dispatchesCounted() - dispatchesBefore === op.batch * samples;
      } else if (op.eventsPerIteration > 0) {
        verified = emitted >= op.eventsPerIteration * op.batch * samples;
      } else {
        verified = true;
      }
    }

    result[name] = {
      kind: op.kind,
      batch: op.batch,
      samplesNs: perOp,
      medianNs: median(perOp),
      p95Ns: quantile(perOp, 0.95),
      heapBefore,
      heapAfter,
      verified,
      emittedEvents: emitted,
      subscriberSaw: (subscriber?.count() ?? 0) - subscriberBefore,
    };
  }

  const calibrationAfter = calibrationNs();
  const listenerErrors = inst?.getSnapshot().counters.listenerErrors ?? 0;
  root.destroy();
  return {
    provenance: prov,
    ok: true,
    config,
    hasInstrumentation,
    instrumentationAvailableInBuild: available,
    padding: padding.length,
    samples,
    warmupBatches,
    timer: {
      crossOriginIsolated: globalThis.crossOriginIsolated,
      tickMs,
      note: 'performance.now() in the page: CPU time of the JavaScript calls only',
    },
    calibrationNs: { before: calibrationBefore, after: calibrationAfter },
    listenerErrors,
    ops: result,
  };
}

declare global {
  interface Window {
    runBench: typeof runBench;
  }
}
window.runBench = runBench;
