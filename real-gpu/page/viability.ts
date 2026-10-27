/**
 * Viability gate: representative workloads on a real device, each with the events it MUST produce
 * (derived from reading the hook sites, written down before looking at the output), checked against
 * three independent views of the same stream: the live subscription, the console reporter's lines and
 * the JSONL export. Generic invariants (ordering, duplicates, referential integrity, counters) run on
 * every scenario.
 *
 * A scenario only appears here if it can actually be triggered and observed on this device.
 */
import { d, tgpu } from 'typegpu';
import type {
  TgpuInstrumentation,
  TgpuInstrumentationEvent as Ev,
  TgpuInstrumentationSnapshot as Snapshot,
} from '../../../src/core/instrumentation/types.ts';
import { attachConsoleReporter } from '../consumers/consoleReporter.ts';
import { createJsonlExport } from '../consumers/jsonlExport.ts';
import { provenance } from './provenance.ts';

type Finding = { scenario: string; check: string; pass: boolean; detail?: unknown };
type Run = {
  events: Ev[];
  consoleLines: string[];
  jsonl: string[];
  snapshot: Snapshot;
  inst: TgpuInstrumentation;
  notes: Record<string, unknown>;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const ofType = <T extends Ev['type']>(events: readonly Ev[], type: T) =>
  events.filter((e): e is Extract<Ev, { type: T }> => e.type === type);
const types = (events: readonly Ev[]) => events.map((e) => e.type);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const findings: Finding[] = [];
const evidence: Record<string, unknown> = {};
let current = '';
const check = (name: string, pass: boolean, detail?: unknown) =>
  findings.push({ scenario: current, check: name, pass, detail });

// --- programs ---

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

const noop = tgpu.computeFn({ workgroupSize: [1] })`{}`;

// A full-screen triangle from the vertex index: (-1,-1), (3,-1), (-1,3).
const vertexFull = tgpu.vertexFn({
  in: { idx: d.builtin.vertexIndex },
  out: { pos: d.builtin.position },
})(({ idx }) => {
  'use gpu';
  const x = d.f32(idx & 1) * 4 - 1;
  const y = d.f32(idx >> 1) * 4 - 1;
  return { pos: d.vec4f(x, y, 0, 1) };
});

const fragmentRed = tgpu.fragmentFn({ out: d.vec4f })(() => {
  'use gpu';
  return d.vec4f(1, 0, 0, 1);
});

const brokenCompute = tgpu.computeFn({
  workgroupSize: [1],
})`{ let x = definitelyUndeclared(1.0); }`;
const brokenFragment = tgpu.fragmentFn({ out: d.vec4f })`{ return definitelyUndeclared; }`;

// --- harness ---

type Ctx = {
  root: Awaited<ReturnType<typeof tgpu.init>>;
  inst: TgpuInstrumentation;
  keep: (...objects: unknown[]) => void;
  note: (key: string, value: unknown) => void;
};

async function execute(body: (ctx: Ctx) => Promise<void>, historySize = 1024): Promise<Run> {
  const root = await tgpu.init({ unstable_instrumentation: { historySize } });
  const inst = root['~unstable'].instrumentation;
  if (!inst) throw new Error('instrumentation missing');
  const events: Ev[] = [];
  inst.subscribe((e) => events.push(e));
  const consoleLines: string[] = [];
  const reporter = attachConsoleReporter(inst, { log: (line) => consoleLines.push(line) });
  const exported = createJsonlExport(inst);
  const kept: unknown[] = [];
  const notes: Record<string, unknown> = {};

  await body({ root, inst, keep: (...o) => kept.push(...o), note: (k, v) => (notes[k] = v) });
  await root.device.queue.onSubmittedWorkDone();
  await sleep(200); // compiler diagnostics settle asynchronously

  const snapshot = inst.getSnapshot();
  exported.addSnapshot();
  void kept.length;
  root.destroy();
  for (let i = 0; i < 40 && !events.some((e) => e.type === 'device-lost'); i++) await sleep(50);
  reporter.dispose();
  exported.dispose();
  // what a human needs to review: the real consumer output, JSONL and snapshot of this scenario
  evidence[current] = {
    consoleLines: consoleLines.slice(0, 80),
    jsonl: exported.lines().slice(0, 80),
    snapshot,
    notes,
    eventCount: events.length,
  };
  return { events, consoleLines, jsonl: exported.lines(), snapshot, inst, notes };
}

/** Invariants that must hold for any scenario. */
function invariants(run: Run) {
  const { events } = run;
  check(
    'seq is contiguous from 1',
    events.every((e, i) => e.seq === i + 1),
  );
  check(
    't never decreases',
    events.every((e, i) => i === 0 || e.t >= (events[i - 1] as Ev).t),
  );

  const materialized = ofType(events, 'resource-materialized');
  const dupMat = materialized.length !== new Set(materialized.map((m) => m.id)).size;
  check('no resource materialized twice', !dupMat);
  const destroyed = ofType(events, 'resource-destroyed');
  check(
    'no resource destroyed twice',
    destroyed.length === new Set(destroyed.map((x) => x.id)).size,
  );
  check(
    'every destroy follows a materialize of the same resource, type and label',
    destroyed.every((x) => {
      const m = materialized.find((y) => y.id === x.id);
      return m !== undefined && m.resource === x.resource && m.label === x.label && m.seq < x.seq;
    }),
  );

  const compiled = ofType(events, 'pipeline-compiled');
  const failed = ofType(events, 'pipeline-compile-failed');
  const pipelineIds = [...compiled.map((c) => c.id), ...failed.map((f) => f.id)];
  check(
    'no pipeline reported twice',
    pipelineIds.length === new Set(pipelineIds).size,
    pipelineIds,
  );
  check(
    'pipeline WGSL is non-empty and has a stage entry point',
    [...compiled, ...failed].every((p) => /@(compute|vertex|fragment)/.test(p.wgsl)),
  );

  const groups = ofType(events, 'bind-group-created');
  check(
    'bind group entries refer to resources materialized EARLIER (or are explicitly unknown)',
    groups.every((g) =>
      g.entries.every(
        (e) =>
          e.resourceId === null || materialized.some((m) => m.id === e.resourceId && m.seq < g.seq),
      ),
    ),
  );
  const layoutIds = new Set(compiled.flatMap((c) => c.layoutIds));
  check(
    'a bind group used by a compiled pipeline shares its layout id',
    groups.every((g) => layoutIds.size === 0 || layoutIds.has(g.layoutId)),
    { groups: groups.map((g) => g.layoutId), pipelines: [...layoutIds] },
  );
  check(
    'shader-diagnostics refer to an earlier compiled/failed pipeline',
    ofType(events, 'shader-diagnostics').every((x) =>
      [...compiled, ...failed].some((p) => p.id === x.pipelineId && p.seq < x.seq),
    ),
  );

  // Three views of one stream must agree.
  const records = run.jsonl.map(
    (l) => JSON.parse(l) as { record: string; event?: Ev; afterSeq?: number },
  );
  check('JSONL starts with the header', records[0]?.record === 'header');
  check(
    'JSONL events are exactly the emitted events',
    same(
      records.filter((r) => r.record === 'event').map((r) => r.event),
      events,
    ),
  );
  const snaps = records.filter((r) => r.record === 'snapshot');
  check('JSONL has one snapshot record', snaps.length === 1);
  const lineSeqs = run.consoleLines
    .map((l) => /^\[(\d+)\] /.exec(l)?.[1])
    .filter((s): s is string => s !== undefined)
    .map(Number);
  check(
    'console reporter printed exactly one line per event, in order',
    same(
      lineSeqs,
      events.map((e) => e.seq),
    ),
    { lines: lineSeqs.length, events: events.length },
  );
}

function expectTypes(run: Run, expected: string[]) {
  check('exact event sequence', same(types(run.events), expected), {
    expected,
    actual: types(run.events),
  });
}

// --- scenarios ---

async function resources() {
  current = 'resources';
  const run = await execute(async ({ root, note }) => {
    const buf = root.createBuffer(d.arrayOf(d.u32, 4)).$usage('storage').$name('buf');
    buf.write([1, 2, 3, 4]);
    const tex = root
      .createTexture({ size: [8, 8], format: 'rgba8unorm' })
      .$usage('sampled', 'render')
      .$name('tex');
    root.unwrap(tex);
    const keep = root.createBuffer(d.f32).$usage('uniform').$name('keep');
    root.unwrap(keep);
    buf.destroy();
    buf.destroy(); // idempotent: must not produce a second event
    tex.destroy();
    let threw = false;
    try {
      buf.write([9, 9, 9, 9]);
    } catch {
      threw = true;
    }
    note('writeAfterDestroyThrew', threw);
  });
  invariants(run);
  expectTypes(run, [
    'resource-materialized',
    'resource-materialized',
    'resource-materialized',
    'resource-destroyed',
    'resource-destroyed',
    'root-destroyed',
    'device-lost',
  ]);
  const [m0, m1, m2] = ofType(run.events, 'resource-materialized');
  check(
    'buffer payload: label, size, usage flags',
    m0?.resource === 'buffer' &&
      m0.label === 'buf' &&
      m0.sizeBytes === 16 &&
      m0.usage === (GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC),
    m0,
  );
  check(
    'texture payload: label, format, size, mips, samples, dimension, usage flags',
    m1?.resource === 'texture' &&
      m1.label === 'tex' &&
      m1.format === 'rgba8unorm' &&
      same(m1.size, [8, 8]) &&
      m1.mipLevelCount === 1 &&
      m1.sampleCount === 1 &&
      m1.dimension === '2d' &&
      m1.usage ===
        (GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.RENDER_ATTACHMENT |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.COPY_SRC),
    m1,
  );
  const destroyed = ofType(run.events, 'resource-destroyed');
  check(
    'destroy events name the right resources, once each',
    destroyed[0]?.id === m0?.id && destroyed[1]?.id === m1?.id,
    destroyed,
  );
  const gone = ofType(run.events, 'root-destroyed')[0];
  check(
    'root-destroyed lists exactly the survivor',
    gone?.liveBuffers === 1 && gone.liveTextures === 0 && gone.ownDevice,
    gone,
  );
  check(
    'snapshot before teardown lists only the survivor',
    run.snapshot.resources.length === 1 && run.snapshot.resources[0]?.id === m2?.id,
    run.snapshot.resources,
  );
  check(
    'writing to a destroyed buffer throws and emits nothing',
    run.notes.writeAfterDestroyThrew === true,
  );
}

async function computeBindGroups() {
  current = 'compute-bindgroups';
  const ids: Record<string, unknown> = {};
  const run = await execute(async ({ root, keep, note }) => {
    const data1 = root
      .createBuffer(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8])
      .$usage('storage')
      .$name('data1');
    const data2 = root
      .createBuffer(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8])
      .$usage('storage')
      .$name('data2');
    const factor = root.createBuffer(d.f32, 2).$usage('uniform').$name('factor');
    const bg1 = root.createBindGroup(layout, { data: data1, factor });
    const bg2 = root.createBindGroup(layout, { data: data2, factor });
    const pipeline = root.createComputePipeline({ compute: scale }).$name('scale');
    keep(data1, data2, factor, bg1, bg2, pipeline);
    for (let i = 0; i < 3; i++) pipeline.with(bg1).dispatchWorkgroups(1);
    for (let i = 0; i < 2; i++) pipeline.with(bg2).dispatchWorkgroups(1);
    note('data1', await data1.read());
    note('data2', await data2.read());
    ids.done = true;
  });
  invariants(run);
  expectTypes(run, [
    'pipeline-compiled',
    'resource-materialized', // data1 (entry order of the layout: data, factor)
    'resource-materialized', // factor
    'bind-group-created',
    'resource-materialized', // data2 (factor is shared, not materialized again)
    'bind-group-created',
    'shader-diagnostics',
    'root-destroyed',
    'device-lost',
  ]);
  check(
    'the GPU really ran every dispatch (x2 three times / twice)',
    same(run.notes.data1, [8, 16, 24, 32, 40, 48, 56, 64]) &&
      same(run.notes.data2, [4, 8, 12, 16, 20, 24, 28, 32]),
    { data1: run.notes.data1, data2: run.notes.data2 },
  );
  const [compiled] = ofType(run.events, 'pipeline-compiled');
  check(
    'one lazy compile for five dispatches over two handles',
    ofType(run.events, 'pipeline-compiled').length === 1 &&
      compiled?.trigger === 'lazy' &&
      compiled.label === 'scale',
    compiled && { ...compiled, wgsl: undefined },
  );
  const mats = ofType(run.events, 'resource-materialized');
  const [g1, g2] = ofType(run.events, 'bind-group-created');
  check(
    'bind group 1 maps data->data1 and factor->factor',
    same(g1?.entries, [
      { name: 'data', kind: 'buffer', resourceId: mats[0]?.id },
      { name: 'factor', kind: 'buffer', resourceId: mats[1]?.id },
    ]),
    g1?.entries,
  );
  check(
    'bind group 2 maps data->data2 and the SAME factor id',
    same(g2?.entries, [
      { name: 'data', kind: 'buffer', resourceId: mats[2]?.id },
      { name: 'factor', kind: 'buffer', resourceId: mats[1]?.id },
    ]),
    g2?.entries,
  );
  check(
    'both groups share one layout id, equal to the pipeline layout',
    g1?.layoutId === g2?.layoutId && same(compiled?.layoutIds, [g1?.layoutId]),
  );
  const p = run.snapshot.pipelines[0];
  check(
    'counters: 5 dispatches, 5 submits (read() submits are not counted by design)',
    run.snapshot.pipelines.length === 1 &&
      p?.dispatches === 5 &&
      p.draws === 0 &&
      run.snapshot.counters.submits === 5,
    { pipeline: p && { ...p, wgsl: undefined }, counters: run.snapshot.counters },
  );
  check(
    'snapshot: 3 buffers, 2 bind groups',
    run.snapshot.resources.length === 3 && run.snapshot.bindGroups.length === 2,
  );
}

async function render() {
  current = 'render';
  const run = await execute(async ({ root, keep, note }) => {
    const target = root
      .createTexture({ size: [8, 8], format: 'rgba8unorm' })
      .$usage('render')
      .$name('target');
    const pipeline = root
      .createRenderPipeline({
        vertex: vertexFull,
        fragment: fragmentRed,
        targets: { format: 'rgba8unorm' },
      })
      .$name('triangle');
    keep(target, pipeline);
    const a = pipeline.withColorAttachment({ view: target, loadOp: 'clear', storeOp: 'store' });
    const b = pipeline.withColorAttachment({ view: target, loadOp: 'load', storeOp: 'store' });
    a.draw(3);
    a.draw(3);
    b.draw(3);

    // Read the first pixel back with raw WebGPU (not instrumented) to prove the draws happened.
    const device = root.device;
    const readback = device.createBuffer({
      size: 256 * 8,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const encoder = device.createCommandEncoder();
    encoder.copyTextureToBuffer(
      { texture: root.unwrap(target) },
      { buffer: readback, bytesPerRow: 256 },
      [8, 8, 1],
    );
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    note('pixel', [...new Uint8Array(readback.getMappedRange(0, 4))]);
    readback.destroy();
  });
  invariants(run);
  expectTypes(run, [
    // `#ownPassDescriptor()` reads the compiled pipeline's connected targets before the pass is created,
    // so the pipeline compiles first and the attachment is unwrapped (materialized) after it.
    'pipeline-compiled',
    'resource-materialized',
    'shader-diagnostics',
    'root-destroyed',
    'device-lost',
  ]);
  check('the draw produced red pixels', same(run.notes.pixel, [255, 0, 0, 255]), run.notes.pixel);
  const compiled = ofType(run.events, 'pipeline-compiled')[0];
  check(
    'render pipeline compiled once, lazily, with vertex and fragment stages',
    compiled?.pipeline === 'render' &&
      compiled.trigger === 'lazy' &&
      /@vertex/.test(compiled.wgsl) &&
      /@fragment/.test(compiled.wgsl),
  );
  const p = run.snapshot.pipelines[0];
  check(
    'counters: 3 draws over two handles, 3 submits',
    p?.draws === 3 && p.dispatches === 0 && run.snapshot.counters.submits === 3,
    { draws: p?.draws, submits: run.snapshot.counters.submits },
  );
}

async function explicitInit() {
  current = 'explicit-init';
  const run = await execute(async ({ root, keep }) => {
    const compute = root.createComputePipeline({ compute: noop }).$name('explicitSync');
    compute.initSync();
    const target = root
      .createTexture({ size: [4, 4], format: 'rgba8unorm' })
      .$usage('render')
      .$name('t');
    const renderPipeline = root
      .createRenderPipeline({
        vertex: vertexFull,
        fragment: fragmentRed,
        targets: { format: 'rgba8unorm' },
      })
      .$name('explicitAsync');
    await renderPipeline.initAsync();
    keep(compute, renderPipeline, target);
    compute.dispatchWorkgroups(1); // already compiled: must not compile again
    renderPipeline.withColorAttachment({ view: target, loadOp: 'clear', storeOp: 'store' }).draw(3);
  });
  invariants(run);
  const compiled = ofType(run.events, 'pipeline-compiled');
  check(
    'exactly two compiles, with the explicit triggers, in call order',
    same(
      compiled.map((c) => c.trigger),
      ['initSync', 'initAsync'],
    ) &&
      compiled[0]?.pipeline === 'compute' &&
      compiled[1]?.pipeline === 'render',
    compiled.map((c) => [c.pipeline, c.trigger]),
  );
  check('dispatch/draw after explicit init did not compile again', compiled.length === 2);
  check(
    'counters: 1 dispatch, 1 draw',
    run.snapshot.pipelines.length === 2 &&
      run.snapshot.pipelines.map((p) => p.dispatches + p.draws).every((n) => n === 1),
  );
  check('every compile got its diagnostics', ofType(run.events, 'shader-diagnostics').length === 2);
}

async function syncFailures() {
  current = 'sync-failures';
  const run = await execute(async ({ root, keep }) => {
    const c = root.createComputePipeline({ compute: brokenCompute }).$name('brokenCompute');
    c.initSync();
    await root.device.queue.onSubmittedWorkDone();
    await sleep(100);
    const r = root
      .createRenderPipeline({
        vertex: vertexFull,
        fragment: brokenFragment,
        targets: { format: 'rgba8unorm' },
      })
      .$name('brokenRender');
    r.initSync();
    keep(c, r);
  });
  invariants(run);
  const compiled = ofType(run.events, 'pipeline-compiled');
  const diags = ofType(run.events, 'shader-diagnostics');
  const errors = ofType(run.events, 'device-error');
  check(
    'both invalid pipelines are reported as compiled (by design: sync creation cannot know) ...',
    compiled.length === 2 && compiled.every((c) => c.trigger === 'initSync'),
  );
  check(
    '... and each has a compiler ERROR pointing at the offending generated line',
    compiled.every((c) => {
      const dg = diags.find((x) => x.pipelineId === c.id);
      return (
        dg?.messages.some(
          (m) =>
            m.type === 'error' &&
            (c.wgsl.split('\n')[m.lineNum - 1] ?? '').includes('definitelyUndeclared'),
        ) === true
      );
    }),
    diags.map((x) => x.messages),
  );
  check(
    'no pipeline-compile-failed on the sync path',
    ofType(run.events, 'pipeline-compile-failed').length === 0,
  );
  check(
    'device errors name the bad identifier',
    errors.length >= 2 && errors.some((e) => e.message.includes('definitelyUndeclared')),
    errors.map((e) => e.message.split('\n')[0]),
  );
  run.notes.deviceErrorCount = errors.length;
  check(
    'snapshot still lists both pipelines (they are "live" objects, whatever their validity)',
    run.snapshot.pipelines.length === 2,
  );
}

async function asyncFailures() {
  current = 'async-failures';
  const run = await execute(async ({ root, note }) => {
    const rejections: string[] = [];
    try {
      await root
        .createComputePipeline({ compute: brokenCompute })
        .$name('asyncCompute')
        .initAsync();
    } catch (e) {
      rejections.push((e as Error).constructor.name);
    }
    try {
      await root
        .createRenderPipeline({
          vertex: vertexFull,
          fragment: brokenFragment,
          targets: { format: 'rgba8unorm' },
        })
        .$name('asyncRender')
        .initAsync();
    } catch (e) {
      rejections.push((e as Error).constructor.name);
    }
    note('rejections', rejections);
  });
  invariants(run);
  check(
    'both creations rejected with GPUPipelineError',
    same(run.notes.rejections, ['GPUPipelineError', 'GPUPipelineError']),
    run.notes.rejections,
  );
  const failed = ofType(run.events, 'pipeline-compile-failed');
  check(
    'one pipeline-compile-failed per failure, compute then render',
    failed.length === 2 &&
      same(
        failed.map((f) => f.pipeline),
        ['compute', 'render'],
      ) &&
      failed.every((f) => f.trigger === 'initAsync' && f.errorType === 'GPUPipelineError'),
    failed.map((f) => ({ ...f, wgsl: undefined })),
  );
  check(
    'no pipeline-compiled event for a failed async creation',
    ofType(run.events, 'pipeline-compiled').length === 0,
  );
  const diags = ofType(run.events, 'shader-diagnostics');
  check(
    'each failure has compiler diagnostics with an error at the bad line',
    failed.every((f) =>
      diags.some(
        (x) =>
          x.pipelineId === f.id &&
          x.messages.some(
            (m) =>
              m.type === 'error' &&
              (f.wgsl.split('\n')[m.lineNum - 1] ?? '').includes('definitelyUndeclared'),
          ),
      ),
    ),
  );
  check('failed pipelines are not listed as live', run.snapshot.pipelines.length === 0);
  check('device errors were also reported', ofType(run.events, 'device-error').length >= 1);
}

async function lifecycle() {
  current = 'lifecycle';
  const ITER = 2000;
  const HISTORY = 64;
  let a = 0;
  let b = 0;
  let c = 0;
  const run = await execute(async ({ root, inst, note }) => {
    inst.subscribe(() => a++);
    const offB = inst.subscribe(() => {
      b++;
      if (b === 100) offB();
    });
    inst.subscribe(() => {
      c++;
      throw new Error('consumer bug');
    });
    for (let i = 0; i < ITER; i++) {
      const buf = root.createBuffer(d.f32).$usage('uniform');
      root.unwrap(buf);
      buf.destroy();
    }
    note('afterLoop', { history: inst.history().length, snapshot: inst.getSnapshot().counters });
    const seqBeforeDisable = inst.history().at(-1)?.seq;

    inst.disable();
    const aBefore = a;
    const historyBefore = inst.history();
    for (let i = 0; i < 100; i++) {
      const buf = root.createBuffer(d.f32).$usage('uniform');
      root.unwrap(buf);
      buf.destroy();
    }
    note('disabled', {
      listenerCalls: a - aBefore,
      historyUnchanged: same(inst.history(), historyBefore),
      enabled: inst.enabled,
      snapshotEnabled: inst.getSnapshot().enabled,
    });

    inst.enable();
    const resumed = root.createBuffer(d.f32).$usage('uniform');
    root.unwrap(resumed);
    note('resume', { firstSeqAfterEnable: inst.history().at(-1)?.seq, seqBeforeDisable });

    // A compile whose diagnostics are still in flight when instrumentation is disposed.
    const pipeline = root.createComputePipeline({ compute: noop });
    const aBeforeCompile = a;
    pipeline.initSync(); // emits pipeline-compiled now; its diagnostics are still in flight
    inst.dispose();
    await root.device.queue.onSubmittedWorkDone();
    await sleep(200);
    const buf = root.createBuffer(d.f32).$usage('uniform');
    root.unwrap(buf);
    buf.destroy();
    note('disposed', { listenerCallsAfterDispose: a - aBeforeCompile, enabled: inst.enabled });
  }, HISTORY);

  const after = run.notes.afterLoop as {
    history: number;
    snapshot: { droppedEvents: number; listenerErrors: number };
  };
  check(
    `history stays at the bound (${HISTORY}) under ${ITER * 2} events`,
    after.history === HISTORY,
    after,
  );
  check(
    'droppedEvents accounts for every evicted event',
    after.snapshot.droppedEvents === ITER * 2 - HISTORY,
    after.snapshot,
  );
  check('subscriber A received every event', a >= ITER * 2, a);
  check('subscriber B stopped receiving after unsubscribing (exactly 100)', b === 100, b);
  check(
    'throwing subscriber C did not disturb A and every throw was counted',
    c >= ITER * 2 && after.snapshot.listenerErrors === ITER * 2,
    { c, listenerErrors: after.snapshot.listenerErrors },
  );
  const dis = run.notes.disabled as {
    listenerCalls: number;
    historyUnchanged: boolean;
    enabled: boolean;
    snapshotEnabled: boolean;
  };
  check(
    'disabled: no listener calls, history untouched, enabled=false',
    dis.listenerCalls === 0 && dis.historyUnchanged && !dis.enabled && !dis.snapshotEnabled,
    dis,
  );
  const resume = run.notes.resume as { firstSeqAfterEnable: number; seqBeforeDisable: number };
  check(
    'enable() resumes with the next sequence number (nothing recorded while disabled)',
    resume.firstSeqAfterEnable === resume.seqBeforeDisable + 1,
    resume,
  );
  const disposed = run.notes.disposed as { listenerCallsAfterDispose: number; enabled: boolean };
  // exactly one event after the counter was taken: the pipeline-compiled emitted before dispose();
  // the in-flight diagnostics and the later buffer activity must not arrive
  check(
    'after dispose(): the in-flight diagnostics and later resource activity produce no events',
    disposed.listenerCallsAfterDispose === 1 && !disposed.enabled,
    disposed,
  );
  check(
    'JSONL parity holds even while history is bounded (every event exported)',
    run.jsonl.filter((l) => l.startsWith('{"record":"event"')).length === run.events.length,
  );
}

async function neverOptedIn() {
  current = 'never-opted-in';
  const root = await tgpu.init();
  const buf = root.createBuffer(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8]).$usage('storage');
  const factor = root.createBuffer(d.f32, 2).$usage('uniform');
  const bg = root.createBindGroup(layout, { data: buf, factor });
  const pipeline = root.createComputePipeline({ compute: scale });
  pipeline.with(bg).dispatchWorkgroups(1);
  const result = await buf.read();
  check(
    'without the option there is no instrumentation object at all',
    root['~unstable'].instrumentation === undefined,
  );
  check(
    'the workload still produces correct results',
    same(result, [2, 4, 6, 8, 10, 12, 14, 16]),
    result,
  );
  root.destroy();
}

// --- entry point ---

export async function runViability() {
  const prov = await provenance();
  if (prov.pageClassification === 'unavailable') {
    return { provenance: prov, ok: false, report: ['WebGPU unavailable'], scenarios: [] };
  }
  const scenarios: { name: string; error?: string; run?: Omit<Run, 'inst'> }[] = [];
  const all: [string, () => Promise<void>][] = [
    ['resources', resources],
    ['compute-bindgroups', computeBindGroups],
    ['render', render],
    ['explicit-init', explicitInit],
    ['sync-failures', syncFailures],
    ['async-failures', asyncFailures],
    ['lifecycle', lifecycle],
    ['never-opted-in', neverOptedIn],
  ];
  for (const [name, fn] of all) {
    try {
      await fn();
      scenarios.push({ name });
    } catch (error) {
      current = name;
      check('scenario ran to completion', false, String(error));
      scenarios.push({ name, error: String(error) });
    }
  }
  const report: string[] = [];
  for (const [name] of all) {
    const mine = findings.filter((f) => f.scenario === name);
    report.push(`\n== ${name}: ${mine.filter((f) => f.pass).length}/${mine.length} checks`);
    for (const f of mine) {
      report.push(`${f.pass ? 'PASS' : 'FAIL'}  ${f.check}`);
      if (!f.pass) report.push(`        detail: ${JSON.stringify(f.detail)?.slice(0, 600)}`);
    }
  }
  return {
    provenance: prov,
    ok: findings.every((f) => f.pass),
    report,
    findings,
    scenarios,
    evidence,
  };
}
