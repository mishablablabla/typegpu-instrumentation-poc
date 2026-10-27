/**
 * Regression tests for defects found by an independent audit of the event semantics, ordering, error handling
 * and lifetimes (each repro first failed on the layer as it was before the fixes). The ids (D3, R1, ...) are the
 * audit's, kept so a failure can be traced back to its finding.
 */
import { afterEach, describe, expect, vi } from 'vitest';
import { d, tgpu } from 'typegpu';
import { snapshotResource } from 'typegpu/~internal';
import { it } from 'typegpu-testing-utility';
import {
  computeMain,
  enabledRoot,
  flush,
  layout,
  makeObservableDevice,
  internalsOf,
  mockOf,
  ofType,
  typesOf,
} from './support.ts';

const slot = tgpu.slot<number>(); // no default: resolving a shader that reads it throws
const brokenCompute = tgpu.computeFn({ workgroupSize: [1] })(() => {
  'use gpu';
  layout.$.values[0] = slot.$;
});

function bindGroupFor(root: ReturnType<typeof enabledRoot>['root']) {
  const values = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage').$name('values');
  return root.createBindGroup(layout, { values });
}

/** What hook sites call. Reached through the root's internals, which is exactly what TypeGPU's code does. */
const sinkOf = (root: ReturnType<typeof enabledRoot>['root']) => internalsOf(root).instrumentation;

describe('counters and ids', () => {
  it('D1 does not count a dispatch that threw before anything was recorded', ({
    device,
    computePassEncoder,
  }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const pipeline = root.createComputePipeline({ compute: computeMain }); // no bind group given

    expect(() => pipeline.dispatchWorkgroups(1)).toThrow(/bind group/i);

    expect(computePassEncoder.dispatchWorkgroups).not.toHaveBeenCalled();
    expect(inst.getSnapshot().pipelines[0]?.dispatches).toBe(0);
  });

  it('D2 keeps a pipeline id stable when a failed async compile is retried successfully', async ({
    device,
  }) => {
    makeObservableDevice(device);
    mockOf(device).createComputePipelineAsync.mockRejectedValueOnce(new Error('invalid'));
    const { root, events, inst } = enabledRoot(device);
    const pipeline = root.createComputePipeline({ compute: computeMain });

    await expect(pipeline.initAsync()).rejects.toThrow('invalid');
    await pipeline.initAsync();
    await flush();

    const failed = ofType(events, 'pipeline-creation-failed')[0];
    const created = ofType(events, 'pipeline-created')[0];
    expect(created?.id).toBe(failed?.id);
    expect(inst.getSnapshot().pipelines.map((p) => p.id)).toEqual([failed?.id]);
  });
});

describe('failures before a pipeline exists', () => {
  it('D3 reports a pipeline whose WGSL generation throws, and rethrows the very same error', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);

    let thrown: unknown;
    try {
      root.createComputePipeline({ compute: brokenCompute }).initSync();
    } catch (error) {
      thrown = error;
    }

    const [failure] = ofType(events, 'pipeline-creation-failed');
    expect(thrown).toBeInstanceOf(Error);
    expect(failure).toMatchObject({
      pipeline: 'compute',
      trigger: 'initSync',
      phase: 'resolve',
      wgsl: null,
      wgslLength: 0,
      errorType: (thrown as Error).constructor.name,
      message: (thrown as Error).message,
    });
    // Nothing was created, so nothing is listed, and nothing was handed to WebGPU.
    expect(mockOf(device).createShaderModule).not.toHaveBeenCalled();
  });

  it('D3 also covers the lazy path (first dispatch) with trigger "lazy"', ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const group = bindGroupFor(root);

    expect(() =>
      root.createComputePipeline({ compute: brokenCompute }).with(group).dispatchWorkgroups(1),
    ).toThrow();

    expect(ofType(events, 'pipeline-creation-failed')[0]).toMatchObject({
      trigger: 'lazy',
      phase: 'resolve',
    });
  });

  it('D3b initAsync with a WGSL generation error throws synchronously (as it always did) and is reported', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);

    expect(() => root.createComputePipeline({ compute: brokenCompute }).initAsync()).toThrow();

    expect(ofType(events, 'pipeline-creation-failed')[0]).toMatchObject({
      trigger: 'initAsync',
      phase: 'resolve',
    });
  });

  it('E2 the application sees the identical error with and without instrumentation', ({
    device,
  }) => {
    makeObservableDevice(device);
    const message = (fn: () => void) => {
      try {
        fn();
      } catch (error) {
        return `${(error as Error).constructor.name}: ${(error as Error).message}`;
      }
      return 'did not throw';
    };
    const plain = tgpu.initFromDevice({ device });
    const { root } = enabledRoot(device);

    expect(message(() => root.createComputePipeline({ compute: brokenCompute }).initSync())).toBe(
      message(() => plain.createComputePipeline({ compute: brokenCompute }).initSync()),
    );
  });

  it('D12 keeps a failed pipeline retrievable for late subscribers after the ring evicted its event', async ({
    device,
  }) => {
    makeObservableDevice(device);
    mockOf(device).createComputePipelineAsync.mockRejectedValueOnce(new Error('invalid'));
    const { root, inst } = enabledRoot(device); // default history of 256 events
    await root
      .createComputePipeline({ compute: computeMain })
      .initAsync()
      .catch(() => {});
    await flush();

    for (let i = 0; i < 300; i++) {
      // the common "new bind group every frame" pattern
      root.unwrap(
        root.createBindGroup(layout, {
          values: root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage'),
        }),
      );
    }

    expect(typesOf(inst.history())).not.toContain('pipeline-creation-failed'); // evicted from the ring...
    const retained = inst.getSnapshot().retainedFailures;
    expect(retained).toHaveLength(1); // ...but pinned
    expect(retained[0]).toMatchObject({
      type: 'pipeline-creation-failed',
      phase: 'create',
      message: 'invalid',
    });
    expect((retained[0] as { wgsl: string }).wgsl).toContain('fn computeMain');
  });

  it('retains at most 16 pipeline failures, newest kept', async ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    for (let i = 0; i < 20; i++) {
      expect(() =>
        root.createComputePipeline({ compute: brokenCompute }).$name(`p${i}`).initSync(),
      ).toThrow();
    }
    const retained = inst.getSnapshot().retainedFailures;
    expect(retained).toHaveLength(16);
    expect((retained.at(-1) as { label: string }).label).toBe('p19');
    expect((retained[0] as { label: string }).label).toBe('p4');
  });
});

describe('event content', () => {
  it('D8 attributes a texture bound directly in a bind group to its tracked resource id', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const texLayout = tgpu.bindGroupLayout({ tex: { texture: d.texture2d(d.f32) } });
    const texture = root
      .createTexture({ size: [4, 4], format: 'rgba8unorm' })
      .$usage('sampled')
      .$name('tex');

    root.unwrap(root.createBindGroup(texLayout, { tex: texture as never }));

    const textureId = ofType(events, 'resource-materialized').find(
      (e) => e.resource === 'texture',
    )?.id;
    expect(textureId).toBeDefined();
    expect(ofType(events, 'bind-group-created')[0]?.entries).toEqual([
      { name: 'tex', kind: 'texture', resourceId: textureId },
    ]);
  });

  it('D9 attributes a texture view entry to its texture', ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const texLayout = tgpu.bindGroupLayout({ tex: { texture: d.texture2d(d.f32) } });
    const texture = root.createTexture({ size: [4, 4], format: 'rgba8unorm' }).$usage('sampled');

    root.unwrap(root.createBindGroup(texLayout, { tex: texture.createView(d.texture2d(d.f32)) }));

    const textureId = ofType(events, 'resource-materialized').find(
      (e) => e.resource === 'texture',
    )?.id;
    expect(ofType(events, 'bind-group-created')[0]?.entries[0]?.resourceId).toBe(textureId);
  });

  it('D10 (documented limitation) calls a group "adopted" when it already holds a GPUBindGroup, e.g. after a snapshot', ({
    device,
  }) => {
    makeObservableDevice(device);
    const a = enabledRoot(device);
    const b = enabledRoot(device);
    const bindGroup = bindGroupFor(a.root);
    a.root.unwrap(bindGroup);
    snapshotResource(bindGroup);

    b.root.unwrap(bindGroup);

    // `origin` says what this root observed: the first root created the GPU object, the second only received one.
    expect(ofType(a.events, 'bind-group-created')[0]?.origin).toBe('created');
    expect(ofType(b.events, 'bind-group-created')[0]?.origin).toBe('adopted');
  });

  it('G9 reports a destruction after the GPU object was destroyed, not before', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const buffer = root.createBuffer(d.f32).$usage('uniform');
    root.unwrap(buffer);
    const rawBuffer = mockOf(device).createBuffer.mock.results[0]?.value as {
      destroy: ReturnType<typeof vi.fn>;
    };
    let destroyCallsAtEvent = -1;
    inst.subscribe((event) => {
      if (event.type === 'resource-destroyed') {
        destroyCallsAtEvent = rawBuffer.destroy.mock.calls.length;
      }
    });

    buffer.destroy();

    expect(destroyCallsAtEvent).toBe(1);
  });
});

describe('re-entrancy and subscriptions', () => {
  it('R1 a listener that touches the bind group being announced does not recurse', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const bindGroup = bindGroupFor(root);
    inst.subscribe((event) => {
      if (event.type === 'bind-group-created') {
        root.unwrap(bindGroup);
      }
    });

    root.unwrap(bindGroup);

    expect(mockOf(device).createBindGroup).toHaveBeenCalledTimes(1);
    expect(ofType(inst.history(), 'bind-group-created')).toHaveLength(1);
  });

  it('R2 every listener sees seq order even when a listener triggers a nested event', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const seen: number[][] = [[], []];
    let nested = false;
    inst.subscribe((event) => {
      seen[0]!.push(event.seq);
      if (!nested) {
        nested = true;
        root.unwrap(root.createBuffer(d.f32).$usage('uniform'));
      }
    });
    inst.subscribe((event) => seen[1]!.push(event.seq));

    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect(seen[0]).toEqual([1, 2]);
    expect(seen[1]).toEqual([1, 2]);
  });

  it('R3 a listener unsubscribed by an earlier listener is not called for the in-flight event', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const late = vi.fn();
    let unsubscribeLate = () => {};
    inst.subscribe(() => unsubscribeLate());
    unsubscribeLate = inst.subscribe(late);

    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect(late).not.toHaveBeenCalled();
  });

  it('R4 dispose() from a listener stops delivery of the in-flight event to later listeners', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const late = vi.fn();
    inst.subscribe(() => inst.dispose());
    inst.subscribe(late);

    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect(late).not.toHaveBeenCalled();
  });

  it('R6 subscribing the same function twice gives two independent unsubscribers', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const listener = vi.fn();
    const offFirst = inst.subscribe(listener);
    inst.subscribe(listener);

    offFirst();
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('R7 rejects a non-function listener instead of failing on every event', ({ device }) => {
    makeObservableDevice(device);
    const { inst } = enabledRoot(device);
    expect(() => inst.subscribe(undefined as never)).toThrowError(TypeError);
    expect(() => inst.subscribe({} as never)).toThrowError(/function/);
    expect(inst.getSnapshot().counters.listenerErrors).toBe(0);
  });
});

describe('the layer never disturbs the application', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('R9 a fault inside a hook leaves TypeGPU state intact, switches the layer off and is reported once', ({
    device,
  }) => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const sink = sinkOf(root);

    const bad = {
      get size(): number {
        throw new Error('injected');
      },
      usage: 0,
    };
    expect(() => sink.bufferMaterialized!({}, bad as never)).not.toThrow();

    const counters = inst.getSnapshot().counters;
    expect(counters.internalErrors).toBe(1);
    expect(counters.lastInternalError).toBe('Error: injected');
    expect(inst.enabled).toBe(false);
    expect(reportError).toHaveBeenCalledTimes(1);

    // The application keeps working on a root whose instrumentation failed.
    const buffer = root.createBuffer(d.arrayOf(d.u32, 2), [1, 2]).$usage('storage');
    expect(() => root.unwrap(buffer)).not.toThrow();
    expect(() => root.createComputePipeline({ compute: computeMain }).initSync()).not.toThrow();
  });

  it('R10 an exception in the diagnostics request does not leak into initSync()', ({ device }) => {
    vi.stubGlobal('reportError', vi.fn());
    makeObservableDevice(device);
    mockOf(device).createShaderModule.mockImplementation(({ label }: { label?: string }) => ({
      label,
      getCompilationInfo: () => {
        throw new Error('compilation info exploded');
      },
    }));
    const { root, inst } = enabledRoot(device);

    expect(() => root.createComputePipeline({ compute: computeMain }).initSync()).not.toThrow();
    // A second call must behave exactly like the first one would have without instrumentation.
    expect(() => root.createComputePipeline({ compute: computeMain }).initSync()).not.toThrow();
    expect(inst.getSnapshot().counters.internalErrors).toBe(1);
  });

  it('A6 consumers cannot reach or forge the hook methods', ({ device }) => {
    makeObservableDevice(device);
    const { inst } = enabledRoot(device);
    const surface = Object.keys(inst).toSorted();
    expect(surface).toEqual(
      ['disable', 'dispose', 'enable', 'enabled', 'getSnapshot', 'history', 'subscribe'].toSorted(),
    );
    expect((inst as unknown as Record<string, unknown>).bufferMaterialized).toBeUndefined();
    expect(Object.isFrozen(inst)).toBe(true);
  });

  it('A5 snapshot.unavailable is frozen and lists the known blind spots', ({ device }) => {
    makeObservableDevice(device);
    const { inst } = enabledRoot(device);
    const { unavailable } = inst.getSnapshot();
    expect(Object.isFrozen(unavailable)).toBe(true);
    expect(unavailable).toEqual(
      expect.arrayContaining([
        'gpuExecutionTime',
        'helperSubmissions',
        'restoredPipelines',
        'wrappedResources',
        'rawWebGPUCalls',
      ]),
    );
  });
});

describe('teardown and device loss', () => {
  it('D11 root.destroy() of an owned device is terminal: loss delivered once, then nothing', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const root = await tgpu.init({
      unstable_instrumentation: (
        await import('typegpu/unstable-instrumentation')
      ).createInstrumentation(),
    });
    const inst = root['~unstable'].instrumentation!;
    const events: { type: string }[] = [];
    inst.subscribe((e) => events.push(e));
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    root.destroy();
    root.unwrap(root.createBuffer(d.f32).$usage('uniform')); // after destroy: must not be reported
    observable.lose('destroyed', 'Device was destroyed.');
    await flush();
    observable.fireError('late error');
    await flush();

    expect(events.map((e) => e.type)).toEqual([
      'resource-materialized',
      'root-destroyed',
      'device-lost',
    ]);
    expect(inst.getSnapshot().resources).toEqual([]);
    expect(inst.enabled).toBe(false);
  });

  it('T2 a root created on a device that was already lost still learns about the loss', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const first = enabledRoot(device);
    observable.lose('unknown', 'gpu crashed');
    await flush();
    expect(ofType(first.events, 'device-lost')).toHaveLength(1);

    const second = enabledRoot(device);
    await flush();

    expect(ofType(second.events, 'device-lost')).toEqual([
      expect.objectContaining({ reason: 'unknown', message: 'gpu crashed' }),
    ]);
  });
});

describe('disabling is a documented blind spot, not an accident', () => {
  it('D5 a pipeline first compiled while disabled stays untracked after enable()', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const bindGroup = bindGroupFor(root);
    const pipeline = root.createComputePipeline({ compute: computeMain });

    inst.disable();
    pipeline.with(bindGroup).dispatchWorkgroups(1); // lazy compile happens here, unobserved
    inst.enable();
    pipeline.with(bindGroup).dispatchWorkgroups(1);

    expect(inst.getSnapshot().pipelines).toEqual([]);
  });
});
