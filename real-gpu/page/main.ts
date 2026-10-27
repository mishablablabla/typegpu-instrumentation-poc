/**
 * Real-device validation scenario. Runs in a browser page against `navigator.gpu`.
 * It is driven by real-gpu/run.mjs, which also collects the browser's own console output.
 *
 * Two kinds of results:
 *  - `checks`: assertions that must hold for the run to count as validated.
 *  - `observations`: facts about the real implementation that the design only assumed (reported, not asserted).
 */
import { d, tgpu } from 'typegpu';
import { runExample } from './example.ts';
import { provenance } from './provenance.ts';
import type {
  TgpuInstrumentation,
  TgpuInstrumentationEvent,
} from '../../../src/core/instrumentation/types.ts';

type Check = { id: string; description: string; pass: boolean; detail?: unknown };
type Observation = { id: string; value: unknown };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const phase = (name: string) => console.info(`[phase] ${name}`);

function collect(inst: TgpuInstrumentation) {
  const events: TgpuInstrumentationEvent[] = [];
  inst.subscribe((e) => events.push(e));
  return events;
}
const ofType = <T extends TgpuInstrumentationEvent['type']>(
  events: readonly TgpuInstrumentationEvent[],
  type: T,
) => events.filter((e): e is Extract<TgpuInstrumentationEvent, { type: T }> => e.type === type);

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

const vertexMain = tgpu.vertexFn({
  in: { idx: d.builtin.vertexIndex },
  out: { pos: d.builtin.position },
})(({ idx }) => {
  'use gpu';
  return { pos: d.vec4f(d.f32(idx) - 1, d.f32(idx % 2) * 2 - 1, 0, 1) };
});

const fragmentMain = tgpu.fragmentFn({ out: d.vec4f })(() => {
  'use gpu';
  return d.vec4f(1, 0, 0, 1);
});

// Raw WGSL with an identifier that does not exist: the browser must reject it.
const broken = tgpu.computeFn({ workgroupSize: [1] })`{ let x = definitelyUndeclared(1.0); }`;

// --- scenario ---

export async function runRealDeviceScenario() {
  // V8 may collect objects that are unreachable from the rest of the function, and the instrumentation
  // (correctly) forgets them. Hold on to everything that must still be listed at the end.
  const keepAlive: unknown[] = [];
  const checks: Check[] = [];
  const observations: Observation[] = [];
  const check = (id: string, description: string, pass: boolean, detail?: unknown) =>
    checks.push({ id, description, pass, detail });
  const observe = (id: string, value: unknown) => observations.push({ id, value });

  const prov = await provenance();
  if (prov.pageClassification === 'unavailable') {
    return { provenance: prov, checks, observations, events: [], snapshot: null };
  }

  // 1. Initialization on a device the root owns.
  const root = await tgpu.init({ unstable_instrumentation: { historySize: 64 } });
  const inst = root['~unstable'].instrumentation;
  check('init', 'instrumentation is present and enabled after tgpu.init', inst?.enabled === true);
  if (!inst) {
    return { provenance: prov, checks, observations, events: [], snapshot: null };
  }
  const events = collect(inst);
  const lostByBrowser = root.device.lost.then((info) => ({
    reason: info.reason,
    message: info.message,
  }));

  // 2. Compute: resources, shader, pipeline, dispatch, readback.
  phase('compute');
  const data = root
    .createBuffer(d.arrayOf(d.f32, 8), [1, 2, 3, 4, 5, 6, 7, 8])
    .$usage('storage')
    .$name('data');
  const factor = root.createBuffer(d.f32, 3).$usage('uniform').$name('factor');
  const bindGroup = root.createBindGroup(layout, { data, factor });
  const pipeline = root.createComputePipeline({ compute: scale }).$name('scalePipeline');
  keepAlive.push(data, factor, bindGroup, pipeline);
  pipeline.with(bindGroup).dispatchWorkgroups(1);
  const result = await data.read();
  await root.device.queue.onSubmittedWorkDone();
  await sleep(50); // getCompilationInfo() settles asynchronously

  check(
    'compute-result',
    'the GPU actually ran the shader (readback equals input * 3)',
    result.every((v, i) => v === (i + 1) * 3),
    result,
  );
  const compiled = ofType(events, 'pipeline-compiled');
  check(
    'pipeline-event',
    'exactly one pipeline-compiled event, lazy, with generated WGSL',
    compiled.length === 1 &&
      compiled[0]?.trigger === 'lazy' &&
      /fn scale/.test(compiled[0]?.wgsl ?? ''),
    compiled.map((c) => ({ trigger: c.trigger, label: c.label, wgslLength: c.wgsl.length })),
  );
  const diagnostics = ofType(events, 'shader-diagnostics');
  check(
    'diagnostics-valid',
    'getCompilationInfo reported for the valid shader with no errors',
    diagnostics.length === 1 && diagnostics[0]?.messages.every((m) => m.type !== 'error') === true,
    diagnostics.map((x) => x.messages),
  );
  const materialized = ofType(events, 'resource-materialized');
  check(
    'resources',
    'both buffers materialized with their sizes, before the bind group',
    materialized.length === 2 &&
      materialized.find(
        (m) => m.label === 'data' && m.resource === 'buffer' && m.sizeBytes === 32,
      ) !== undefined &&
      events.findIndex((e) => e.type === 'bind-group-created') >
        Math.max(...materialized.map((m) => events.indexOf(m))),
    materialized.map((m) => ({
      label: m.label,
      ...(m.resource === 'buffer' ? { size: m.sizeBytes } : {}),
    })),
  );
  const group = ofType(events, 'bind-group-created')[0];
  check(
    'bind-group',
    'bind group entries resolve to the tracked buffers',
    group !== undefined &&
      group.entries.length === 2 &&
      group.entries.every((e) => e.resourceId !== null),
    group?.entries,
  );
  const snap1 = inst.getSnapshot();
  check(
    'counters',
    'one dispatch and at least one submit counted',
    snap1.pipelines[0]?.dispatches === 1 && snap1.counters.submits >= 1,
    {
      pipelines: snap1.pipelines.map((p) => ({ label: p.label, dispatches: p.dispatches })),
      submits: snap1.counters.submits,
    },
  );
  factor.write(4);
  const factorInfo = inst.getSnapshot().resources.find((r) => r.label === 'factor');
  check(
    'buffer-writes',
    'a TypeGPU write is counted per buffer with its byte size',
    factorInfo?.writes === 1 && factorInfo.bytesWritten === 4,
    factorInfo,
  );
  observe(
    'compute.cpuMs',
    compiled.map((c) => ({
      resolveMs: c.resolveMs,
      createMs: c.createMs,
      note: 'CPU times, not GPU',
    })),
  );

  // 3. Render: a draw into an offscreen texture (not read back).
  phase('render');
  const target = root
    .createTexture({ size: [16, 16], format: 'rgba8unorm' })
    .$usage('render')
    .$name('target');
  const render = root
    .createRenderPipeline({
      vertex: vertexMain,
      fragment: fragmentMain,
      targets: { format: 'rgba8unorm' },
    })
    .$name('trianglePipeline');
  keepAlive.push(target, render);
  render.withColorAttachment({ view: target, loadOp: 'clear', storeOp: 'store' }).draw(3);
  await root.device.queue.onSubmittedWorkDone();
  await sleep(50);
  const snap2 = inst.getSnapshot();
  check(
    'render',
    'render pipeline compiled lazily and one draw counted, no device error so far',
    snap2.pipelines.some((p) => p.pipeline === 'render' && p.draws === 1) &&
      ofType(events, 'device-error').length === 0,
    snap2.pipelines.map((p) => ({ kind: p.pipeline, label: p.label, draws: p.draws })),
  );

  // 4. Shader error: invalid WGSL, synchronous creation (the error is reported asynchronously and uncaptured).
  phase('broken-shader-sync');
  const before = events.length;
  root.createComputePipeline({ compute: broken }).$name('brokenSync').initSync();
  await root.device.queue.onSubmittedWorkDone();
  await sleep(300);
  const after = events.slice(before);
  const brokenDiag = ofType(after, 'shader-diagnostics').find((x) =>
    x.messages.some((m) => m.type === 'error'),
  );
  const brokenCompiled = ofType(after, 'pipeline-compiled')[0];
  check(
    'diagnostics-error',
    'the compiler error is reported with a line number that points at the offending line of the generated WGSL',
    brokenDiag !== undefined &&
      brokenDiag.messages.some(
        (m) =>
          m.type === 'error' &&
          (brokenCompiled?.wgsl.split('\n')[m.lineNum - 1] ?? '').includes('definitelyUndeclared'),
      ),
    { messages: brokenDiag?.messages, wgsl: brokenCompiled?.wgsl },
  );
  const errors = ofType(after, 'device-error');
  check(
    'device-error',
    'the invalid pipeline surfaced as an uncaptured device error',
    errors.length > 0,
    errors.map((e) => ({ errorType: e.errorType, message: e.message })),
  );
  observe(
    'error.messageMentionsTypeGPULabel',
    errors.some((e) => /brokenSync|computeFn|Shader/.test(e.message)),
  );

  // 5. Shader error through the async path: a rejection, not an uncaptured error.
  phase('broken-shader-async');
  let asyncRejection: string | null = null;
  const beforeAsync = events.length;
  try {
    await root.createComputePipeline({ compute: broken }).$name('brokenAsync').initAsync();
  } catch (error) {
    asyncRejection = `${(error as Error).constructor.name}: ${(error as Error).message}`;
  }
  await sleep(300);
  const afterAsync = events.slice(beforeAsync);
  observe('async.pipelineCreation', {
    rejected: asyncRejection !== null,
    rejection: asyncRejection,
    pipelineCompiledEvents: ofType(afterAsync, 'pipeline-compiled').length,
    shaderDiagnosticsWithErrors: ofType(afterAsync, 'shader-diagnostics').filter(
      (x) => x.messages.length > 0,
    ).length,
    deviceErrors: ofType(afterAsync, 'device-error').length,
  });

  const failedEvent = ofType(afterAsync, 'pipeline-compile-failed')[0];
  const failedDiagnostics = ofType(afterAsync, 'shader-diagnostics').find(
    (x) => failedEvent !== undefined && x.pipelineId === failedEvent.id,
  );
  check(
    'async-failure-event',
    'an invalid pipeline created with initAsync reports pipeline-compile-failed with its WGSL, and the compiler error follows',
    failedEvent?.errorType === 'GPUPipelineError' &&
      failedEvent.wgsl.includes('definitelyUndeclared') &&
      failedDiagnostics?.messages.some((m) => m.type === 'error') === true,
    {
      failed: failedEvent && { ...failedEvent, wgsl: undefined },
      diagnostics: failedDiagnostics?.messages,
    },
  );
  observe(
    'async.rejectionNamesFirstIdenticalModule',
    asyncRejection?.includes('brokenSync') ?? null,
  );

  // 6. Leak report and teardown of a root that owns its device.
  data.destroy();
  phase('teardown');
  const destroyedEvents = ofType(events, 'resource-destroyed').length;
  root.destroy();
  const lost = await Promise.race([lostByBrowser, sleep(3000).then(() => null)]);
  await sleep(50);
  const rootDestroyed = ofType(events, 'root-destroyed')[0];
  const lostEvent = ofType(events, 'device-lost')[0];
  check(
    'resource-destroyed',
    'destroying a buffer produced a resource-destroyed event',
    destroyedEvents === 1,
  );
  check(
    'root-destroyed',
    'root-destroyed reports the resources that were still alive (factor buffer + target texture)',
    rootDestroyed?.liveBuffers === 1 && rootDestroyed.liveTextures === 1 && rootDestroyed.ownDevice,
    rootDestroyed,
  );
  check(
    'device-lost-owned',
    'destroying the owned device produced a device-lost event with reason "destroyed"',
    lost?.reason === 'destroyed' && lostEvent?.reason === 'destroyed',
    { browser: lost, event: lostEvent },
  );
  check(
    'seq',
    'event sequence numbers are contiguous and history is bounded',
    events.every((e, i) => e.seq === i + 1) && inst.history().length <= 64,
    { events: events.length, history: inst.history().length },
  );

  // 7. Does having our listener change what the browser prints? Uses its own device, so the main run is not disturbed.
  // An adapter can create only one device, so every extra device needs its own adapter.
  const newDevice = async () => (await navigator.gpu.requestAdapter())!.requestDevice();
  const makeError = (device: GPUDevice) =>
    device.createTexture({
      label: 'bogus-texture',
      size: [0, 0],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING,
    });

  const deviceX = await newDevice();
  const rootX = tgpu.initFromDevice({ device: deviceX, unstable_instrumentation: true });
  const instX = rootX['~unstable'].instrumentation!;
  const eventsX = collect(instX);
  phase('error-with-listener');
  makeError(deviceX);
  await deviceX.queue.onSubmittedWorkDone();
  await sleep(300);
  instX.dispose(); // removes the uncapturederror listener
  phase('error-without-listener');
  makeError(deviceX);
  await deviceX.queue.onSubmittedWorkDone();
  await sleep(300);
  phase('listener-experiment-done');
  const withListener = ofType(eventsX, 'device-error');
  check(
    'raw-error-event',
    'a raw validation error was delivered as a device-error event exactly once (and not after dispose)',
    withListener.length === 1 && withListener[0]?.errorType === 'GPUValidationError',
    withListener.map((e) => ({ errorType: e.errorType, message: e.message })),
  );
  observe(
    'error.rawMessageMentionsLabel',
    withListener[0]?.message.includes('bogus-texture') ?? null,
  );
  deviceX.destroy();

  // 8. Device loss on a borrowed device, destroyed directly (the root stays alive).
  const deviceY = await newDevice();
  const rootY = tgpu.initFromDevice({ device: deviceY, unstable_instrumentation: true });
  const instY = rootY['~unstable'].instrumentation!;
  const eventsY = collect(instY);
  rootY.unwrap(rootY.createBuffer(d.f32).$usage('uniform').$name('leftover'));
  phase('device-destroy-borrowed');
  deviceY.destroy();
  await sleep(300);
  const lostY = ofType(eventsY, 'device-lost')[0];
  check(
    'device-lost-borrowed',
    'destroying a borrowed device directly produced a device-lost event; the hub stayed attached',
    lostY?.reason === 'destroyed' && instY.enabled,
    lostY,
  );
  rootY.destroy();
  const rootYDestroyed = ofType(eventsY, 'root-destroyed')[0];
  check(
    'leak-after-loss',
    'root.destroy() on a borrowed root reports the buffer TypeGPU never destroyed',
    rootYDestroyed?.liveBuffers === 1 && !rootYDestroyed.ownDevice,
    rootYDestroyed,
  );

  // 9. Garbage collection with a real device. The device (kept alive here) holds the hub through its event
  // listener and its `lost` promise, which is the path that once kept the whole root alive.
  const collectGarbage = (globalThis as { gc?: () => void }).gc;
  if (collectGarbage === undefined) {
    observe('gc.real', 'skipped: gc() is not exposed (Chrome needs --js-flags=--expose-gc)');
  } else {
    const deviceZ = await newDevice();
    const make = () => {
      const rootZ = tgpu.initFromDevice({ device: deviceZ, unstable_instrumentation: true });
      const buffer = rootZ.createBuffer(d.f32).$usage('uniform');
      rootZ.unwrap(buffer);
      const pipelineZ = rootZ.createComputePipeline({ compute: scale });
      pipelineZ.initSync();
      return {
        instZ: rootZ['~unstable'].instrumentation!,
        refs: {
          root: new WeakRef(rootZ),
          buffer: new WeakRef(buffer),
          pipeline: new WeakRef(pipelineZ),
        },
      };
    };
    const { instZ, refs } = make();
    const liveBefore = instZ.getSnapshot();
    let collected = false;
    for (let i = 0; i < 50 && !collected; i++) {
      await sleep(20);
      collectGarbage();
      collected = Object.values(refs).every((r) => r.deref() === undefined);
    }
    for (let i = 0; i < 50 && instZ.getSnapshot().counters.collectedWithoutDestroy < 1; i++) {
      await sleep(20);
      collectGarbage();
    }
    const liveAfter = instZ.getSnapshot();
    check(
      'gc-real-device',
      'with a live real device, the root, buffer and pipeline are garbage-collected and the registry forgets them',
      liveBefore.resources.length === 1 &&
        collected &&
        liveAfter.resources.length === 0 &&
        liveAfter.pipelines.length === 0 &&
        liveAfter.counters.collectedWithoutDestroy === 1,
      {
        collected,
        before: { resources: liveBefore.resources.length, pipelines: liveBefore.pipelines.length },
        after: {
          resources: liveAfter.resources.length,
          pipelines: liveAfter.pipelines.length,
          collectedWithoutDestroy: liveAfter.counters.collectedWithoutDestroy,
        },
      },
    );
    deviceZ.destroy();
  }

  // 10. How coarse are the CPU timings the events carry?
  const deltas = new Set<number>();
  for (let last = performance.now(), i = 0; i < 5_000_000 && deltas.size < 5; i++) {
    const now = performance.now();
    if (now !== last) {
      deltas.add(now - last);
      last = now;
    }
  }
  observe('performance.now.smallestStepMs', Math.min(...deltas));

  return {
    provenance: prov,
    checks,
    observations,
    events: events.slice(0, 80),
    snapshot: snap2,
    keptAlive: keepAlive.length,
  };
}

declare global {
  interface Window {
    runRealDeviceScenario: typeof runRealDeviceScenario;
    runExample: typeof runExample;
  }
}
// Assigned here, not in the modules: the package says `sideEffects: false`, so the bundler drops side effects of modules whose exports are unused.
window.runRealDeviceScenario = runRealDeviceScenario;
window.runExample = runExample;
