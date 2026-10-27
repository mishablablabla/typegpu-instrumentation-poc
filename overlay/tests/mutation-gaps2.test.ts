/**
 * Second round of mutation testing, against the hardened layer: each test kills at least one mutant that the
 * whole suite (contract, defects, mutation-gaps, ...) let survive. `Nxx` tags are mutants of the hub, the device
 * listener registry and the size estimate; `Qxx` are mutants of the hook sites in TypeGPU's own files; `Cxx` are
 * mutants of the example consumers. Every test asserts externally observable behaviour.
 */
import { createInstrumentation, estimateEventBytes } from 'typegpu/unstable-instrumentation';
import * as v8 from 'node:v8';
import * as vm from 'node:vm';
import { afterEach, describe, expect, vi } from 'vitest';
import { d, tgpu } from 'typegpu';
import { it } from 'typegpu-testing-utility';
import { $internal } from '../../src/shared/symbols.ts';
import type {
  TgpuInstrumentationEvent,
  TgpuInstrumentationOptions,
} from '../../src/core/instrumentation/types.ts';
import { createJsonlExport } from './consumers/jsonlExport.ts';
import { JsonlFormatError, parseJsonl } from './consumers/jsonlRead.ts';
import { formatEvent, formatSnapshot } from './consumers/textReport.ts';
import {
  computeMain,
  enabledRoot,
  flush,
  fragmentMain,
  layout,
  makeObservableDevice,
  mockOf,
  ofType,
  vertexMain,
} from './support.ts';

v8.setFlagsFromString('--expose-gc');
const gc = vm.runInNewContext('gc') as () => void;

type Root = ReturnType<typeof enabledRoot>['root'];

/** One `resource-materialized` event whose payload size is controlled by the label length. */
function materialize(root: Root, label = 'b') {
  const buffer = root.createBuffer(d.f32).$usage('uniform').$name(label);
  root.unwrap(buffer);
  return buffer;
}

const slot = tgpu.slot<number>(); // no default: resolving a shader that reads it throws
const brokenCompute = tgpu.computeFn({ workgroupSize: [1] })(() => {
  'use gpu';
  layout.$.values[0] = slot.$;
});
const brokenFragment = tgpu.fragmentFn({ out: d.vec4f })(() => {
  'use gpu';
  return d.vec4f(slot.$, 0, 0, 1);
});

function renderPipelineOf(root: Root, fragment: typeof fragmentMain | typeof brokenFragment = fragmentMain) {
  return root.createRenderPipeline({
    vertex: vertexMain,
    fragment,
    targets: { format: 'rgba8unorm' },
  });
}

async function collectUntil(isDone: () => boolean) {
  for (let i = 0; i < 30 && !isDone(); i++) {
    await flush();
    gc();
  }
}

/** Fails `count` async compute pipeline creations of one pipeline and returns its events. */
async function failComputeTimes(
  device: GPUDevice,
  options: TgpuInstrumentationOptions,
  count: number,
) {
  makeObservableDevice(device);
  const { root, inst, events } = enabledRoot(device, options);
  const pipeline = root.createComputePipeline({ compute: computeMain });
  for (let i = 0; i < count; i++) {
    mockOf(device).createComputePipelineAsync.mockRejectedValueOnce(new Error('same message'));
    await pipeline.initAsync().catch(() => {});
  }
  return { root, inst, events, failures: ofType(events, 'pipeline-creation-failed') };
}

describe('options and bounds', () => {
  // N04
  it('keeps about 4 MiB of history by default', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const label = 'x'.repeat(600_000); // about 1.2 MB of estimated payload per event

    for (let i = 0; i < 4; i++) {
      materialize(root, label);
    }

    // 3 events (about 3.6 MB) fit below 4 MiB, a fourth (about 4.8 MB) does not
    expect(inst.history()).toHaveLength(3);
    expect(inst.getSnapshot().counters.historyBytes).toBeLessThan(4 * 1024 * 1024);
  });

  // N06
  it('accepts historyMaxBytes up to Number.MAX_SAFE_INTEGER and no more', ({ device }) => {
    const attach = (historyMaxBytes: number) =>
      tgpu.initFromDevice({
        device,
        unstable_instrumentation: createInstrumentation({ historyMaxBytes }),
      });

    expect(() => attach(Number.MAX_SAFE_INTEGER)).not.toThrow();
    expect(() => attach(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });

  // N42
  it('keeps events that fit the byte bound exactly', ({ device }) => {
    makeObservableDevice(device);
    const probe = enabledRoot(device);
    materialize(probe.root);
    const size = estimateEventBytes(probe.inst.history()[0]);
    const { root, inst } = enabledRoot(device, { historyMaxBytes: 2 * size });

    materialize(root);
    materialize(root);
    expect(inst.history()).toHaveLength(2);
    expect(inst.getSnapshot().counters.historyBytes).toBe(2 * size);

    materialize(root);
    expect(inst.history().map((e) => e.seq)).toEqual([2, 3]);
  });

  // N48, N49
  it('keeps its byte accounting and order exact through thousands of evictions', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device, { historySize: 5 });

    for (let i = 0; i < 3_000; i++) {
      materialize(root, `buffer-${i}`);
    }

    const history = inst.history();
    const counters = inst.getSnapshot().counters;
    expect(history.map((e) => e.seq)).toEqual([2996, 2997, 2998, 2999, 3000]);
    expect(counters.historyBytes).toBe(history.reduce((sum, e) => sum + estimateEventBytes(e), 0));
    expect(counters.droppedEvents).toBe(2_995);
  });

  // N46
  it('lets an evicted event be garbage-collected', async ({ device }) => {
    makeObservableDevice(device);
    const root = tgpu.initFromDevice({
      device,
      unstable_instrumentation: createInstrumentation({ historySize: 1 }),
    });
    const inst = root['~unstable'].instrumentation!;
    const ref = (() => {
      materialize(root, 'first');
      return new WeakRef(inst.history()[0] as object);
    })();

    materialize(root, 'second'); // evicts the first event
    await collectUntil(() => ref.deref() === undefined);

    expect(ref.deref()).toBeUndefined();
    expect(inst.history()).toHaveLength(1);
  });

  // N57, N60, N61
  it('bounds retained failures by bytes, and always keeps the newest', async ({ device }) => {
    const probe = await failComputeTimes(device, {}, 1);
    const size = estimateEventBytes(probe.failures[0]);

    // 2.5 failures fit: after the third one exactly the two newest remain
    const bounded = await failComputeTimes(device, { historyMaxBytes: Math.floor(2.5 * size) }, 3);
    const retained = bounded.inst.getSnapshot().retainedFailures;
    expect(retained.map((f) => f.seq)).toEqual(bounded.failures.slice(-2).map((f) => f.seq));

    const tiny = await failComputeTimes(device, { historyMaxBytes: Math.floor(size / 2) }, 3);
    const newest = tiny.failures.at(-1);
    expect(tiny.inst.getSnapshot().retainedFailures.map((f) => f.seq)).toEqual([newest?.seq]);
  });

  // N16
  it('hands out snapshots that later failures do not change', async ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const pipeline = root.createComputePipeline({ compute: computeMain });
    mockOf(device).createComputePipelineAsync.mockRejectedValueOnce(new Error('first'));
    await pipeline.initAsync().catch(() => {});
    const earlier = inst.getSnapshot();

    mockOf(device).createComputePipelineAsync.mockRejectedValueOnce(new Error('second'));
    await pipeline.initAsync().catch(() => {});

    expect(earlier.retainedFailures).toHaveLength(1);
    expect(inst.getSnapshot().retainedFailures).toHaveLength(2);
  });

  // N52
  it('retains the device loss outside the history ring', async ({ device }) => {
    const observable = makeObservableDevice(device);
    const { root, inst } = enabledRoot(device, { historySize: 1 });

    observable.lose('unknown', 'gpu crashed');
    await flush();
    materialize(root);
    materialize(root);

    expect(inst.history().map((e) => e.type)).toEqual(['resource-materialized']);
    expect(inst.getSnapshot().retainedFailures).toEqual([
      expect.objectContaining({ type: 'device-lost', reason: 'unknown', message: 'gpu crashed' }),
    ]);
  });

  // N74
  it('keeps no WGSL of a failed pipeline either when captureSource is off', async ({ device }) => {
    const { failures } = await failComputeTimes(device, { captureSource: false }, 1);

    expect(failures[0]?.wgsl).toBeNull();
    expect(failures[0]?.wgslLength).toBeGreaterThan(0);
  });

  // N18
  it('lists every documented blind spot as unavailable', ({ device }) => {
    makeObservableDevice(device);
    const { inst } = enabledRoot(device);

    expect(inst.getSnapshot().unavailable).toEqual(
      expect.arrayContaining([
        'helperSubmissions',
        'restoredPipelines',
        'samplers',
        'textureViews',
        'renderBundles',
        'bindGroupLayouts',
      ]),
    );
  });
});

describe('delivery and failure reporting', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // N26
  it('cuts a subscriber that keeps causing events off after exactly 10 000 events', ({ device }) => {
    vi.stubGlobal('reportError', vi.fn());
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device, { historySize: 0 });
    let delivered = 0;
    inst.subscribe(() => {
      delivered++;
      materialize(root);
    });

    materialize(root);

    expect(delivered).toBe(10_000);
  });

  // N31
  it('surfaces the same subscriber failure only once', ({ device }) => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    inst.subscribe(() => {
      throw new Error('same failure');
    });

    for (let i = 0; i < 10; i++) {
      materialize(root);
    }

    expect(inst.getSnapshot().counters.listenerErrors).toBe(10);
    expect(reportError).toHaveBeenCalledTimes(1);
  });
});

describe('event size estimate', () => {
  // N96..N102 (relations that follow from the documented rule, not the constants)
  it('charges strings per UTF-16 unit, numbers 8, booleans and null 4, and objects and fields extra', () => {
    expect(estimateEventBytes('abcdefghij') - estimateEventBytes('abcde')).toBe(10);
    expect(estimateEventBytes(1)).toBe(8);
    expect(estimateEventBytes(true)).toBe(4);
    expect(estimateEventBytes(null)).toBe(4);

    expect(estimateEventBytes({})).toBeGreaterThan(0);
    // a field costs more than its value alone, and the value's own cost is added
    expect(estimateEventBytes({ a: 1 }) - estimateEventBytes({})).toBeGreaterThan(8);
    expect(estimateEventBytes({ a: 1 }) - estimateEventBytes({ a: true })).toBe(4);
    expect(estimateEventBytes({ a: true }) - estimateEventBytes({ a: null })).toBe(0);
    expect(estimateEventBytes({ a: { b: 1 } })).toBeGreaterThan(estimateEventBytes({ a: 1 }));
    expect(estimateEventBytes([1, 2, 3])).toBeGreaterThan(3 * 8);
  });
});

describe('teardown of an owned device', () => {
  async function ownedRoot(device: GPUDevice) {
    const observable = makeObservableDevice(device);
    const root = await tgpu.init({ unstable_instrumentation: createInstrumentation() });
    const inst = root['~unstable'].instrumentation!;
    const events: TgpuInstrumentationEvent[] = [];
    inst.subscribe((e) => events.push(e));
    return { observable, root, inst, events };
  }

  // N88
  it('stops listening for device errors as soon as the root is destroyed', async ({ device }) => {
    const { observable, root } = await ownedRoot(device);
    expect(observable.errorListenerCount).toBe(1);

    root.destroy();

    expect(observable.errorListenerCount).toBe(0);
  });

  // N89
  it('cannot be re-enabled after the root is destroyed', async ({ device }) => {
    const { root, inst, events } = await ownedRoot(device);
    root.destroy();

    inst.enable();
    materialize(root);

    expect(inst.enabled).toBe(false);
    expect(events.map((e) => e.type)).toEqual(['root-destroyed']);
  });

  // N83
  it('lets go of its subscribers once the terminal device loss was delivered', async ({
    device,
  }) => {
    const { observable, root, inst } = await ownedRoot(device);
    const ref = (() => {
      const listener = () => {};
      inst.subscribe(listener);
      return new WeakRef(listener);
    })();

    root.destroy();
    observable.lose('destroyed', 'Device was destroyed.');
    await collectUntil(() => ref.deref() === undefined);

    expect(ref.deref()).toBeUndefined();
  });

  // Q21
  it('reports root-destroyed before the device is destroyed', async ({ device }) => {
    const { root, inst } = await ownedRoot(device);
    let destroyCallsWhenReported = -1;
    inst.subscribe((e) => {
      if (e.type === 'root-destroyed') {
        destroyCallsWhenReported = (device.destroy as ReturnType<typeof vi.fn>).mock.calls.length;
      }
    });

    root.destroy();

    expect(destroyCallsWhenReported).toBe(0);
    expect(device.destroy).toHaveBeenCalledTimes(1);
  });
});

describe('failures are only reported while recording', () => {
  // N79: a hook site that captured the sink before disable() (a pipeline resolving while the application
  // disables recording) must not make the disabled layer record anything
  it('does not report a WGSL generation failure to a sink captured before disable()', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    const sink = (
      root as unknown as Record<symbol, { instrumentation: Record<string, (...a: unknown[]) => void> }>
    )[$internal]!.instrumentation;

    inst.disable();
    sink.pipelineResolutionFailed!({}, 'compute', 'lazy', new Error('late'));

    expect(events).toEqual([]);
    expect(inst.history()).toEqual([]);
    expect(inst.getSnapshot().counters.internalErrors).toBe(0);
  });

  // N78
  it('does not report an async creation failure that settles after disable()', async ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    let fail!: (error: unknown) => void;
    mockOf(device).createComputePipelineAsync.mockReturnValueOnce(
      new Promise((_, reject) => {
        fail = reject;
      }),
    );
    const pending = root.createComputePipeline({ compute: computeMain }).initAsync();

    inst.disable();
    fail(new Error('invalid'));
    await expect(pending).rejects.toThrow('invalid');
    await flush();

    expect(events).toEqual([]);
    expect(inst.getSnapshot().retainedFailures).toEqual([]);
  });
});

describe('pipeline failures', () => {
  // N77
  it('gives a pipeline whose WGSL generation keeps failing one stable id', ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const pipeline = root.createComputePipeline({ compute: brokenCompute });
    const other = root.createComputePipeline({ compute: brokenCompute });

    expect(() => pipeline.initSync()).toThrow();
    expect(() => pipeline.initSync()).toThrow();
    expect(() => other.initSync()).toThrow();

    const ids = ofType(events, 'pipeline-creation-failed').map((e) => e.id);
    expect(ids).toHaveLength(3);
    expect(ids[1]).toBe(ids[0]);
    expect(ids[2]).not.toBe(ids[0]);
  });

  // Q08, Q09, Q10, Q12, Q14
  it.for([
    ['initSync', 'initSync'],
    ['initAsync', 'initAsync'],
    ['lazy', 'lazy'],
  ] as const)(
    'reports a render pipeline whose WGSL generation fails (%s) and rethrows the same error',
    ([trigger], { device }) => {
      makeObservableDevice(device);
      const { root, events } = enabledRoot(device);
      const texture = root.createTexture({ size: [4, 4], format: 'rgba8unorm' }).$usage('render');
      const pipeline = renderPipelineOf(root, brokenFragment);
      const run = {
        initSync: () => pipeline.initSync(),
        initAsync: () => void pipeline.initAsync(),
        lazy: () =>
          pipeline.withColorAttachment({ view: texture, loadOp: 'clear', storeOp: 'store' }).draw(3),
      }[trigger];

      let thrown: unknown;
      try {
        run();
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toMatch(/slot/i);
      expect(ofType(events, 'pipeline-creation-failed')).toEqual([
        expect.objectContaining({
          pipeline: 'render',
          trigger,
          phase: 'resolve',
          errorType: (thrown as Error).constructor.name,
          message: (thrown as Error).message,
        }),
      ]);
    },
  );

  // Q35..Q39
  it('keeps layouts and requests diagnostics for async creations, compute and render', async ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const paramsLayout = tgpu.bindGroupLayout({ params: { uniform: d.f32 } });
    const fragment = tgpu.fragmentFn({ out: d.vec4f })(() => {
      'use gpu';
      return d.vec4f(paramsLayout.$.params, 0, 0, 1);
    });
    root.unwrap(
      root.createBindGroup(layout, { values: root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage') }),
    );
    root.unwrap(
      root.createBindGroup(paramsLayout, { params: root.createBuffer(d.f32).$usage('uniform') }),
    );
    const [computeGroup, renderGroup] = ofType(events, 'bind-group-created');

    await root.createComputePipeline({ compute: computeMain }).initAsync();
    await renderPipelineOf(root, fragment).initAsync();
    mockOf(device).createRenderPipelineAsync.mockRejectedValueOnce(new Error('invalid'));
    await renderPipelineOf(root, fragment).initAsync().catch(() => {});
    await flush();

    const [compute, render] = ofType(events, 'pipeline-created');
    expect(compute?.layoutIds).toEqual([computeGroup?.layoutId]);
    expect(render?.layoutIds).toEqual([renderGroup?.layoutId]);
    const [failed] = ofType(events, 'pipeline-creation-failed');
    const diagnosed = ofType(events, 'shader-diagnostics').map((e) => e.pipelineId);
    expect(diagnosed).toEqual([compute?.id, render?.id, failed?.id]);
  });
});

describe('hooks run after the effect they report', () => {
  // Q01
  it('does not count a draw that threw', ({ device, renderPassEncoder }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const texture = root.createTexture({ size: [4, 4], format: 'rgba8unorm' }).$usage('render');
    (renderPassEncoder.draw as unknown as { mockImplementationOnce: (fn: () => void) => void }).mockImplementationOnce(() => {
      throw new Error('draw failed');
    });
    const pipeline = renderPipelineOf(root);

    expect(() =>
      pipeline.withColorAttachment({ view: texture, loadOp: 'clear', storeOp: 'store' }).draw(3),
    ).toThrow('draw failed');

    expect(inst.getSnapshot().pipelines[0]).toMatchObject({ draws: 0 });
  });

  // Q02
  it('does not count a dispatch that threw', ({ device, computePassEncoder }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const group = root.createBindGroup(layout, {
      values: root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage'),
    });
    (computePassEncoder.dispatchWorkgroups as unknown as { mockImplementationOnce: (fn: () => void) => void }).mockImplementationOnce(() => {
      throw new Error('dispatch failed');
    });

    expect(() =>
      root.createComputePipeline({ compute: computeMain }).with(group).dispatchWorkgroups(1),
    ).toThrow('dispatch failed');

    expect(inst.getSnapshot().pipelines[0]).toMatchObject({ dispatches: 0 });
  });

  // Q04
  it('reports a texture as destroyed only after the GPU texture was destroyed', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const texture = root.createTexture({ size: [4, 4], format: 'rgba8unorm' }).$usage('sampled');
    const raw = root.unwrap(texture) as unknown as { destroy: ReturnType<typeof vi.fn> };
    let rawDestroyCalls = -1;
    inst.subscribe((e) => {
      if (e.type === 'resource-destroyed') {
        rawDestroyCalls = raw.destroy.mock.calls.length;
      }
    });

    texture.destroy();

    expect(rawDestroyCalls).toBe(1);
  });

  // Q23
  it('does not count a buffer write that the device rejected', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const buffer = root.createBuffer(d.arrayOf(d.u32, 4)).$usage('storage');
    root.unwrap(buffer);
    mockOf(device).queue.writeBuffer.mockImplementationOnce(() => {
      throw new Error('write failed');
    });

    expect(() => buffer.write([1, 2, 3, 4])).toThrow('write failed');

    expect(inst.getSnapshot().resources[0]).toMatchObject({ writes: 0, bytesWritten: 0 });
  });

  // Q24
  it('does not count a buffer patch that the device rejected', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const buffer = root.createBuffer(d.arrayOf(d.u32, 4)).$usage('storage');
    root.unwrap(buffer);
    mockOf(device).queue.writeBuffer.mockImplementationOnce(() => {
      throw new Error('write failed');
    });

    expect(() => buffer.patch([{ idx: 1, value: 9 }] as never)).toThrow('write failed');

    expect(inst.getSnapshot().resources[0]).toMatchObject({ writes: 0, bytesWritten: 0 });
  });

  // Q25, Q26
  it('reports no resource that the device failed to create', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    mockOf(device).createBuffer.mockImplementationOnce(() => {
      throw new Error('out of memory');
    });
    mockOf(device).createTexture.mockImplementationOnce(() => {
      throw new Error('out of memory');
    });

    expect(() => materialize(root)).toThrow('out of memory');
    expect(() =>
      root.unwrap(root.createTexture({ size: [4, 4], format: 'rgba8unorm' }).$usage('sampled')),
    ).toThrow('out of memory');

    expect(events).toEqual([]);
    expect(inst.getSnapshot().resources).toEqual([]);
  });

  // Q27
  it('does not count a submit that threw', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    mockOf(device).queue.submit.mockImplementationOnce(() => {
      throw new Error('submit failed');
    });

    expect(() => root['~unstable'].createCommandEncoder().submit()).toThrow('submit failed');

    expect(inst.getSnapshot().counters.submits).toBe(0);
  });
});

describe('async CPU timing', () => {
  function withClock(start: number) {
    const clock = { now: start };
    const spy = vi.spyOn(performance, 'now').mockImplementation(() => clock.now);
    return { clock, restore: () => spy.mockRestore() };
  }

  // Q28, Q29, Q30, Q31, Q40, Q41
  it('measures the wait for an async creation, successful or not', async ({ device }) => {
    makeObservableDevice(device);
    const mock = mockOf(device);
    const { clock, restore } = withClock(1000);
    try {
      const slowly = (original: (descriptor: unknown) => Promise<unknown>) => async (d: unknown) => {
        clock.now += 9;
        return original(d);
      };
      mock.createComputePipelineAsync.mockImplementation(
        slowly(
          mock.createComputePipelineAsync.getMockImplementation() as (
            descriptor: unknown,
          ) => Promise<unknown>,
        ),
      );
      mock.createRenderPipelineAsync.mockImplementation(
        slowly(
          mock.createRenderPipelineAsync.getMockImplementation() as (
            descriptor: unknown,
          ) => Promise<unknown>,
        ),
      );
      const { root, events } = enabledRoot(device);

      await root.createComputePipeline({ compute: computeMain }).initAsync();
      await renderPipelineOf(root).initAsync();
      mock.createComputePipelineAsync.mockImplementationOnce(async () => {
        clock.now += 9;
        throw new Error('invalid');
      });
      mock.createRenderPipelineAsync.mockImplementationOnce(async () => {
        clock.now += 9;
        throw new Error('invalid');
      });
      await root.createComputePipeline({ compute: computeMain }).initAsync().catch(() => {});
      await renderPipelineOf(root).initAsync().catch(() => {});

      const timed = events.filter(
        (e) => e.type === 'pipeline-created' || e.type === 'pipeline-creation-failed',
      ) as (TgpuInstrumentationEvent & { resolveMs: number; createMs: number })[];
      expect(timed).toHaveLength(4);
      expect(timed.map((e) => [e.resolveMs, e.createMs])).toEqual([
        [0, 9],
        [0, 9],
        [0, 9],
        [0, 9],
      ]);
    } finally {
      restore();
    }
  });

  // Q32, Q33, Q34
  it('measures the WGSL generation of async creations too', async ({ device }) => {
    makeObservableDevice(device);
    let tick = 0;
    const spy = vi.spyOn(performance, 'now').mockImplementation(() => ++tick);
    try {
      const { root, events } = enabledRoot(device);
      await root.createComputePipeline({ compute: computeMain }).initAsync();
      await renderPipelineOf(root).initAsync();
      mockOf(device).createComputePipelineAsync.mockRejectedValueOnce(new Error('invalid'));
      await root.createComputePipeline({ compute: computeMain }).initAsync().catch(() => {});

      const timed = events.filter(
        (e) => e.type === 'pipeline-created' || e.type === 'pipeline-creation-failed',
      ) as (TgpuInstrumentationEvent & { resolveMs: number; createMs: number })[];
      expect(timed).toHaveLength(3);
      for (const event of timed) {
        expect(event.resolveMs).toBeGreaterThan(0);
        expect(event.createMs).toBeGreaterThan(0);
      }
    } finally {
      spy.mockRestore();
    }
  });
});

describe('text report of failures', () => {
  const failed = (overrides: Record<string, unknown>) =>
    ({
      v: 2,
      seq: 1,
      t: 0,
      type: 'pipeline-creation-failed',
      id: 1,
      pipeline: 'compute',
      label: 'p',
      trigger: 'initSync',
      phase: 'resolve',
      resolveMs: 0,
      createMs: 0,
      wgsl: null,
      wgslLength: 0,
      layoutIds: [],
      layoutLabels: [],
      errorType: 'Error',
      message: '',
      ...overrides,
    }) as TgpuInstrumentationEvent;

  // C01, C02, C05, C11
  it('flattens the failing tree of a WGSL generation error into one line', () => {
    const line = formatEvent(
      failed({ message: '- computePipelineCore\n- computeFn:main\n\n  Slot has no value' }),
    );

    expect(line).toBe(
      '[001] compute pipeline p#1 creation FAILED [initSync, resolve] Error: computePipelineCore > computeFn:main >   Slot has no value',
    );
  });

  // C01, C06, C11
  it('shows only the summary line of an async creation error, and the size of the rejected WGSL', () => {
    const line = formatEvent(
      failed({
        phase: 'create',
        trigger: 'initAsync',
        wgslLength: 120,
        message: 'summary line\n  at some stack frame\n  more detail',
      }),
    );

    expect(line).toBe(
      '[001] compute pipeline p#1 creation FAILED [initAsync, create] Error: summary line (120 chars of WGSL)',
    );
  });

  // C03, C04
  it('truncates a long failure text to 300 characters ending in an ellipsis', () => {
    const line = formatEvent(failed({ phase: 'create', message: 'x'.repeat(400) }));

    expect(line.endsWith(`Error: ${'x'.repeat(297)}...`)).toBe(true);
    expect(formatEvent(failed({ phase: 'create', message: 'y'.repeat(300) }))).toMatch(/y{300}$/);
  });
});

describe('text report of snapshots', () => {
  // C07, C08
  it('points out three live resources with one name, but not two', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const keep = [materialize(root, 'dup'), materialize(root, 'dup')];
    const notes = () => formatSnapshot(inst.getSnapshot()).filter((l) => l.includes('note:'));

    expect(notes()).toEqual([]);

    keep.push(materialize(root, 'dup'));
    expect(notes()).toEqual([expect.stringContaining("3 live resources are named 'dup'")]);
  });

  // C09, C10
  it('names the most recent retained failure, even when only one was retained', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const pipeline = root.createComputePipeline({ compute: computeMain });
    mockOf(device).createComputePipelineAsync.mockRejectedValueOnce(new Error('invalid'));
    await pipeline.initAsync().catch(() => {});
    const retained = () => formatSnapshot(inst.getSnapshot()).filter((l) => l.includes('retained'));

    expect(retained()).toEqual(['  1 retained failure(s), most recent: pipeline-creation-failed']);

    observable.lose('unknown', 'gone');
    await flush();
    expect(retained()).toEqual(['  2 retained failure(s), most recent: device-lost']);
  });
});

describe('JSONL reader', () => {
  function validExport(device: GPUDevice) {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const exported = createJsonlExport(inst);
    materialize(root);
    return exported.lines().map((l) => JSON.parse(l) as Record<string, unknown>);
  }
  const text = (records: unknown[]) => `${records.map((r) => JSON.stringify(r)).join('\n')}\n`;

  // C12, C13, C14
  it('rejects a file format, event schema or event version it does not know', ({ device }) => {
    const records = validExport(device);
    expect(parseJsonl(text(records)).events).toHaveLength(1);

    const withHeader = (patch: Record<string, unknown>) => [{ ...records[0], ...patch }, ...records.slice(1)];
    expect(() => parseJsonl(text(withHeader({ version: 2 })))).toThrow(JsonlFormatError);
    expect(() => parseJsonl(text(withHeader({ version: 2 })))).toThrow(/format version/);
    expect(() => parseJsonl(text(withHeader({ eventSchema: 1 })))).toThrow(/event schema/);

    const oldEvent = [records[0], { record: 'event', event: { ...(records[1]?.event as object), v: 1 } }];
    expect(() => parseJsonl(text(oldEvent))).toThrow(/unsupported schema version 1/);
  });
});
