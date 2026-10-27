import * as v8 from 'node:v8';
import * as vm from 'node:vm';
import { describe, expect, vi } from 'vitest';
import { d, tgpu } from 'typegpu';
import { it } from 'typegpu-testing-utility';
import type { TgpuInstrumentationEvent } from '../../src/core/instrumentation/types.ts';
import {
  computeMain,
  flush,
  fragmentMain,
  layout,
  makeObservableDevice,
  ofType,
  typesOf,
  vertexMain,
} from './support.ts';

v8.setFlagsFromString('--expose-gc');
const gc = vm.runInNewContext('gc') as () => void;

function enabledRoot(device: GPUDevice, options: boolean | { historySize?: number } = true) {
  const root = tgpu.initFromDevice({ device, unstable_instrumentation: options });
  const inst = root['~unstable'].instrumentation;
  if (!inst) {
    throw new Error('instrumentation should be enabled');
  }
  const events: TgpuInstrumentationEvent[] = [];
  inst.subscribe((e) => events.push(e));
  return { root, inst, events };
}

function dispatchOnce(root: ReturnType<typeof enabledRoot>['root']) {
  const values = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage').$name('values');
  const bindGroup = root.createBindGroup(layout, { values });
  const pipeline = root.createComputePipeline({ compute: computeMain });
  pipeline.with(bindGroup).dispatchWorkgroups(1);
  return { values, bindGroup, pipeline };
}

describe('instrumentation is opt-in', () => {
  it('is absent by default and attaches nothing to the device', async ({ device }) => {
    const observable = makeObservableDevice(device);
    const root = tgpu.initFromDevice({ device });

    dispatchOnce(root as never);
    await flush();

    expect(root['~unstable'].instrumentation).toBeUndefined();
    expect(observable.addEventListener).not.toHaveBeenCalled();
    expect(observable.getCompilationInfo).not.toHaveBeenCalled();
    root.destroy();
  });

  it('lets an async compile failure through untouched', async ({ device }) => {
    const failure = new Error('invalid');
    (
      device as unknown as { mock: { createComputePipelineAsync: ReturnType<typeof vi.fn> } }
    ).mock.createComputePipelineAsync.mockRejectedValueOnce(failure);
    const root = tgpu.initFromDevice({ device });

    await expect(root.createComputePipeline({ compute: computeMain }).initAsync()).rejects.toBe(
      failure,
    );
  });

  it('is absent for `false`', ({ device }) => {
    const root = tgpu.initFromDevice({ device, unstable_instrumentation: false });
    expect(root['~unstable'].instrumentation).toBeUndefined();
  });
});

describe('events', () => {
  it('reports a lazy compile with WGSL, then materialization, bind group and diagnostics, in order', async ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);

    dispatchOnce(root);
    await flush();

    expect(typesOf(events)).toEqual([
      'pipeline-compiled',
      'resource-materialized',
      'bind-group-created',
      'shader-diagnostics',
    ]);
    expect(events.map((e) => e.seq)).toEqual([1, 2, 3, 4]);

    const [compiled] = ofType(events, 'pipeline-compiled');
    // The label is the variable name, given by the unplugin's auto-naming.
    expect(compiled).toMatchObject({ pipeline: 'compute', trigger: 'lazy', label: 'pipeline' });
    expect(compiled?.wgsl).toContain('@compute @workgroup_size(1)');
    expect(compiled?.wgsl).toContain('fn computeMain');
    expect(compiled?.resolveMs).toBeGreaterThanOrEqual(0);
    expect(compiled?.createMs).toBeGreaterThanOrEqual(0);

    const [buffer] = ofType(events, 'resource-materialized');
    expect(buffer).toMatchObject({ resource: 'buffer', label: 'values', sizeBytes: 16 });
    expect(buffer?.usage).toBe(
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    );

    const [group] = ofType(events, 'bind-group-created');
    expect(group?.origin).toBe('created');
    expect(group?.entries).toEqual([{ name: 'values', kind: 'buffer', resourceId: buffer?.id }]);
    expect(compiled?.layoutIds).toEqual([group?.layoutId]);

    const [diagnostics] = ofType(events, 'shader-diagnostics');
    expect(diagnostics).toEqual(
      expect.objectContaining({ pipelineId: compiled?.id, messages: [] }),
    );
  });

  it('distinguishes explicit initSync, initAsync and lazy compilation', async ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);

    root.createComputePipeline({ compute: computeMain }).initSync();
    await root.createComputePipeline({ compute: computeMain }).initAsync();
    root.createComputePipeline({ compute: computeMain }).with(layout, {} as GPUBindGroup);
    const lazy = root.createComputePipeline({ compute: computeMain });
    lazy
      .with(
        root.createBindGroup(layout, {
          values: root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage'),
        }),
      )
      .dispatchWorkgroups(1);

    expect(ofType(events, 'pipeline-compiled').map((e) => e.trigger)).toEqual([
      'initSync',
      'initAsync',
      'lazy',
    ]);
  });

  it('carries compiler messages and refers to the generated WGSL', async ({ device }) => {
    const observable = makeObservableDevice(device);
    observable.setCompilationMessages([
      { type: 'error', message: 'unknown identifier', lineNum: 1, linePos: 3 },
    ]);
    const { root, events } = enabledRoot(device);

    root.createComputePipeline({ compute: computeMain }).initSync();
    await flush();

    const [diagnostics] = ofType(events, 'shader-diagnostics');
    expect(diagnostics?.messages).toEqual([
      { type: 'error', message: 'unknown identifier', lineNum: 1, linePos: 3 },
    ]);
  });

  // Regression for a gap found on a real device: an invalid shader created with initAsync() rejects, and
  // before this event existed nothing at all was reported (no WGSL, no compiler messages).
  it('reports an async compute failure with the WGSL, then the compiler messages, and recovers on retry', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    observable.setCompilationMessages([
      { type: 'error', message: 'unresolved call target', lineNum: 1, linePos: 3 },
    ]);
    class GPUPipelineError extends Error {}
    const failure = new GPUPipelineError('[Invalid ShaderModule] is invalid');
    (
      device as unknown as { mock: { createComputePipelineAsync: ReturnType<typeof vi.fn> } }
    ).mock.createComputePipelineAsync.mockRejectedValueOnce(failure);
    const { root, events, inst } = enabledRoot(device);
    const pipeline = root.createComputePipeline({ compute: computeMain });

    await expect(pipeline.initAsync()).rejects.toBe(failure);
    await flush();

    expect(typesOf(events)).toEqual(['pipeline-compile-failed', 'shader-diagnostics']);
    const [failed] = ofType(events, 'pipeline-compile-failed');
    expect(failed).toMatchObject({
      pipeline: 'compute',
      trigger: 'initAsync',
      errorType: 'GPUPipelineError',
      message: '[Invalid ShaderModule] is invalid',
    });
    expect(failed?.wgsl).toContain('fn computeMain');
    expect(ofType(events, 'shader-diagnostics')[0]).toMatchObject({
      pipelineId: failed?.id,
      messages: [{ type: 'error', message: 'unresolved call target' }],
    });
    expect(inst.getSnapshot().pipelines).toEqual([]);

    await pipeline.initAsync();
    expect(ofType(events, 'pipeline-compiled')).toHaveLength(1);
    expect(inst.getSnapshot().pipelines).toHaveLength(1);
  });

  it('reports an async render failure too', async ({ device }) => {
    makeObservableDevice(device);
    const failure = new Error('render pipeline is invalid');
    (
      device as unknown as { mock: { createRenderPipelineAsync: ReturnType<typeof vi.fn> } }
    ).mock.createRenderPipelineAsync.mockRejectedValueOnce(failure);
    const { root, events } = enabledRoot(device);
    const pipeline = root.createRenderPipeline({
      vertex: vertexMain,
      fragment: fragmentMain,
      targets: { format: 'rgba8unorm' },
    });

    await expect(pipeline.initAsync()).rejects.toBe(failure);

    expect(ofType(events, 'pipeline-compile-failed')).toEqual([
      expect.objectContaining({ pipeline: 'render', errorType: 'Error', message: failure.message }),
    ]);
  });

  it('counts dispatches on all handles of one pipeline and submits of TypeGPU encoders', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const { pipeline, bindGroup } = dispatchOnce(root);
    pipeline.with(bindGroup).dispatchWorkgroups(1);

    const encoder = root['~unstable'].createCommandEncoder();
    encoder.submit();

    const snapshot = inst.getSnapshot();
    expect(snapshot.pipelines).toHaveLength(1);
    expect(snapshot.pipelines[0]).toMatchObject({ dispatches: 2, draws: 0 });
    // two own-encoder dispatches + one explicit encoder
    expect(snapshot.counters.submits).toBe(3);
  });

  it('counts draws and reports a render pipeline', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    const texture = root
      .createTexture({ size: [16, 16], format: 'rgba8unorm' })
      .$usage('render')
      .$name('target');

    const pipeline = root.createRenderPipeline({
      vertex: vertexMain,
      fragment: fragmentMain,
      targets: { format: 'rgba8unorm' },
    });
    pipeline.withColorAttachment({ view: texture, loadOp: 'clear', storeOp: 'store' }).draw(3);
    pipeline.withColorAttachment({ view: texture, loadOp: 'load', storeOp: 'store' }).draw(3);

    expect(ofType(events, 'pipeline-compiled')[0]).toMatchObject({
      pipeline: 'render',
      trigger: 'lazy',
    });
    expect(ofType(events, 'resource-materialized')[0]).toMatchObject({
      resource: 'texture',
      label: 'target',
      format: 'rgba8unorm',
      size: [16, 16],
      mipLevelCount: 1,
    });
    expect(inst.getSnapshot().pipelines[0]).toMatchObject({ draws: 2, dispatches: 0 });
  });

  it('tracks writes per buffer and leaves textures untracked', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const buffer = root.createBuffer(d.arrayOf(d.u32, 4)).$usage('storage').$name('data');
    buffer.write([1, 2, 3, 4]);
    buffer.patch([{ idx: 1, value: 9 }] as never);
    root
      .createTexture({ size: [4, 4], format: 'rgba8unorm' })
      .$usage('sampled')
      .$name('t')
      .createView(d.texture2d(d.f32));
    root.unwrap(root.createTexture({ size: [4, 4], format: 'rgba8unorm' }).$usage('sampled'));

    const [data] = inst.getSnapshot().resources.filter((r) => r.label === 'data');
    expect(data).toMatchObject({ resource: 'buffer', sizeBytes: 16, writes: 2 });
    expect(data?.bytesWritten).toBeGreaterThanOrEqual(16);
    const textures = inst.getSnapshot().resources.filter((r) => r.resource === 'texture');
    expect(textures.every((t) => t.writes === null && t.sizeBytes === null)).toBe(true);
  });

  it('reports destruction and drops the resource from the snapshot', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    const buffer = root.createBuffer(d.f32).$usage('uniform').$name('u');
    root.unwrap(buffer);
    const id = ofType(events, 'resource-materialized')[0]?.id;

    buffer.destroy();
    buffer.destroy();

    expect(ofType(events, 'resource-destroyed')).toEqual([
      expect.objectContaining({ id, resource: 'buffer', label: 'u' }),
    ]);
    expect(inst.getSnapshot().resources).toEqual([]);
  });

  it('marks bind group entries it cannot attribute as null, not absent', ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const raw = device.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE });
    const bindGroup = root.createBindGroup(layout, { values: raw as never });
    root.unwrap(bindGroup);

    expect(ofType(events, 'bind-group-created')[0]?.entries).toEqual([
      { name: 'values', kind: 'buffer', resourceId: null },
    ]);
  });

  it('reflects later $name() calls in snapshots', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const buffer = root.createBuffer(d.f32).$usage('uniform');
    root.unwrap(buffer);
    expect(inst.getSnapshot().resources[0]?.label).toBe('buffer'); // auto-named after the variable

    buffer.$name('renamed');
    expect(inst.getSnapshot().resources[0]?.label).toBe('renamed');
  });
});

describe('subscription', () => {
  it('delivers to multiple consumers and stops after unsubscribe', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const a: TgpuInstrumentationEvent[] = [];
    const b: TgpuInstrumentationEvent[] = [];
    const offA = inst.subscribe((e) => a.push(e));
    inst.subscribe((e) => b.push(e));

    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));
    offA();
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect(a).toHaveLength(1);
    expect(b).toHaveLength(2);
    expect(b.map((e) => e.seq)).toEqual([1, 2]);
  });

  it('isolates a throwing listener and counts it', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    inst.subscribe(() => {
      throw new Error('consumer bug');
    });

    expect(() => root.unwrap(root.createBuffer(d.f32).$usage('uniform'))).not.toThrow();

    expect(events).toHaveLength(1);
    expect(inst.getSnapshot().counters.listenerErrors).toBe(1);
  });

  it('survives unsubscribing from inside a listener', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const seen: number[] = [];
    const off = inst.subscribe((e) => {
      seen.push(e.seq);
      off();
    });

    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect(seen).toEqual([1]);
  });
});

describe('bounded history', () => {
  it('keeps only the most recent events, oldest first, and counts drops', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device, { historySize: 3 });

    for (let i = 0; i < 5; i++) {
      root.unwrap(root.createBuffer(d.f32).$usage('uniform'));
    }

    expect(inst.history().map((e) => e.seq)).toEqual([3, 4, 5]);
    expect(inst.getSnapshot().counters.droppedEvents).toBe(2);
  });

  it('delivers events even without history', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device, { historySize: 0 });

    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect(inst.history()).toEqual([]);
    expect(events).toHaveLength(1);
  });

  it('lets a late consumer replay history', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect(typesOf(inst.history())).toEqual(['resource-materialized']);
  });
});

describe('enabling and disabling', () => {
  it('stops recording while disabled and tracks nothing created meanwhile', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);

    inst.disable();
    expect(inst.enabled).toBe(false);
    const hidden = root.createBuffer(d.f32).$usage('uniform');
    root.unwrap(hidden);
    inst.enable();
    expect(inst.enabled).toBe(true);
    hidden.destroy(); // untracked: ignored
    const visible = root.createBuffer(d.f32).$usage('uniform');
    root.unwrap(visible);

    expect(typesOf(events)).toEqual(['resource-materialized']);
    expect(inst.getSnapshot().resources).toHaveLength(1);
  });

  it('stops counting in a pass that was opened before disable()', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const { pipeline, bindGroup } = dispatchOnce(root);
    const pass = root['~unstable'].createCommandEncoder().beginComputePass();
    const inPass = pipeline.with(pass).with(bindGroup);

    inPass.dispatchWorkgroups(1);
    inst.disable();
    inPass.dispatchWorkgroups(1);
    inst.enable();

    // 1 from dispatchOnce + 1 in the pass before disable(); the one while disabled is not counted
    expect(inst.getSnapshot().pipelines[0]?.dispatches).toBe(2);
  });

  it('is permanently off after dispose, but history stays readable', ({ device }) => {
    const observable = makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    inst.dispose();
    inst.enable();
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect(inst.enabled).toBe(false);
    expect(events).toHaveLength(1);
    expect(inst.history()).toHaveLength(1);
    expect(observable.removeEventListener).toHaveBeenCalledTimes(1);
    expect(observable.errorListenerCount).toBe(0);
  });
});

describe('device errors and teardown', () => {
  it('reports uncaptured errors and device loss', async ({ device }) => {
    const observable = makeObservableDevice(device);
    const { events } = enabledRoot(device);

    observable.fireError('Binding size is smaller than the minimum binding size');
    observable.lose('unknown', 'GPU process crashed');
    await flush();

    expect(ofType(events, 'device-error')).toEqual([
      expect.objectContaining({
        errorType: 'GPUValidationError',
        message: 'Binding size is smaller than the minimum binding size',
      }),
    ]);
    expect(ofType(events, 'device-lost')).toEqual([
      expect.objectContaining({ reason: 'unknown', message: 'GPU process crashed' }),
    ]);
  });

  it('ignores errors while disabled', ({ device }) => {
    const observable = makeObservableDevice(device);
    const { inst, events } = enabledRoot(device);

    inst.disable();
    observable.fireError('ignored');

    expect(events).toEqual([]);
  });

  it('reports leftovers on root.destroy() and detaches from a borrowed device', ({ device }) => {
    const observable = makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    const kept = root.createBuffer(d.f32).$usage('uniform');
    const dropped = root.createBuffer(d.f32).$usage('uniform');
    root.unwrap(kept);
    root.unwrap(dropped);
    dropped.destroy();

    root.destroy();

    expect(ofType(events, 'root-destroyed')).toEqual([
      expect.objectContaining({ ownDevice: false, liveBuffers: 1, liveTextures: 0 }),
    ]);
    expect(inst.enabled).toBe(false);
    expect(observable.errorListenerCount).toBe(0);
    expect(device.destroy).not.toHaveBeenCalled();
  });

  it('keeps listening for the loss of a device the root owns', async ({ device }) => {
    const observable = makeObservableDevice(device);
    const root = await tgpu.init({ unstable_instrumentation: true });
    const inst = root['~unstable'].instrumentation!;
    const events: TgpuInstrumentationEvent[] = [];
    inst.subscribe((e) => events.push(e));

    root.destroy();
    observable.lose('destroyed', 'Device was destroyed.');
    await flush();

    expect(device.destroy).toHaveBeenCalledTimes(1);
    expect(typesOf(events)).toEqual(['root-destroyed', 'device-lost']);
    expect(ofType(events, 'device-lost')[0]?.reason).toBe('destroyed');
    expect(observable.errorListenerCount).toBe(0);
  });
});

describe('snapshot', () => {
  it('is plain data that survives structuredClone and lists what is unavailable', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    dispatchOnce(root);

    const snapshot = inst.getSnapshot();

    expect(structuredClone(snapshot)).toEqual(snapshot);
    expect(snapshot.unavailable).toEqual(
      expect.arrayContaining(['gpuExecutionTime', 'gpuMemoryUsage', 'wrappedResources']),
    );
    expect(snapshot.bindGroups).toHaveLength(1);
    expect(snapshot.pipelines[0]?.wgsl).toContain('computeMain');
  });
});

describe('garbage collection compatibility', () => {
  async function collect(refs: Record<string, WeakRef<object>>): Promise<string[]> {
    let alive = Object.keys(refs);
    for (let i = 0; i < 20 && alive.length > 0; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      gc();
      alive = alive.filter((key) => refs[key]?.deref() !== undefined);
    }
    return alive;
  }

  function useInstrumentedRoot(device: GPUDevice) {
    const root = tgpu.initFromDevice({ device, unstable_instrumentation: true });
    const { values, bindGroup, pipeline } = dispatchOnce(root as never);
    const texture = root.createTexture({ size: [8, 8], format: 'rgba8unorm' }).$usage('render');
    root.unwrap(texture);
    const instrumentation = root['~unstable'].instrumentation!;
    return {
      instrumentation,
      refs: {
        root: new WeakRef(root),
        values: new WeakRef(values),
        bindGroup: new WeakRef(bindGroup),
        pipeline: new WeakRef(pipeline),
        texture: new WeakRef(texture),
      },
    };
  }

  // Regression: the hub is kept alive by the device (listener + `lost` promise). A callback created
  // in the root's constructor once shared V8's scope object with `super(() => this)` and kept the root alive.
  it('does not keep the root or its resources alive, and forgets them', async ({ device }) => {
    makeObservableDevice(device);
    const { instrumentation, refs } = useInstrumentedRoot(device);
    expect(instrumentation.getSnapshot().resources.length).toBeGreaterThan(0);

    expect(await collect(refs)).toStrictEqual([]);

    // Finalizers run on a later turn than the weak refs clearing.
    for (
      let i = 0;
      i < 20 && instrumentation.getSnapshot().counters.collectedWithoutDestroy < 2;
      i++
    ) {
      await flush();
      gc();
    }
    const after = instrumentation.getSnapshot();
    expect(after.resources).toEqual([]);
    expect(after.pipelines).toEqual([]);
    expect(after.bindGroups).toEqual([]);
    expect(after.counters.collectedWithoutDestroy).toBe(2);
  });

  // Regression, found by the viability gate on a real device: a device keeps its listeners and its `lost`
  // reactions for as long as it lives, so a per-root listener kept every abandoned root's instrumentation
  // (with its event history) alive: 30 of 30 hubs survived. Hot reloading creates roots like this.
  it('does not keep instrumentation of abandoned roots alive through a long-lived device', async ({
    device,
  }) => {
    // plain functions, not vi.fn (which records its arguments): behave like a real device and nothing more
    const listeners = new Set<unknown>();
    const mock = (device as unknown as { mock: Record<string, unknown> }).mock;
    mock.addEventListener = (_type: string, listener: unknown) => listeners.add(listener);
    mock.removeEventListener = (_type: string, listener: unknown) => listeners.delete(listener);
    mock.lost = new Promise(() => {}); // never settles: the device lives on

    const hubs: WeakRef<object>[] = [];
    (() => {
      for (let i = 0; i < 30; i++) {
        const root = tgpu.initFromDevice({ device, unstable_instrumentation: true });
        hubs.push(new WeakRef(root['~unstable'].instrumentation as object));
        root.createComputePipeline({ compute: computeMain }).initSync();
      }
    })();
    expect(listeners.size).toBe(1); // one shared listener, not one per root

    for (let i = 0; i < 20; i++) {
      await flush();
      gc();
    }

    expect(hubs.filter((h) => h.deref() !== undefined)).toHaveLength(0);
    for (let i = 0; i < 20 && listeners.size > 0; i++) {
      await flush();
      gc();
    }
    expect(listeners.size).toBe(0); // the shared listener is removed once the last hub is gone
  });

  it('delivers one device error to every live instrumented root on the same device', ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const a = enabledRoot(device);
    const b = enabledRoot(device);

    observable.fireError('shared');

    expect(ofType(a.events, 'device-error')).toHaveLength(1);
    expect(ofType(b.events, 'device-error')).toHaveLength(1);
    expect(observable.errorListenerCount).toBe(1);

    a.inst.dispose();
    observable.fireError('second');
    expect(ofType(a.events, 'device-error')).toHaveLength(1);
    expect(ofType(b.events, 'device-error')).toHaveLength(2);
    expect(observable.errorListenerCount).toBe(1);

    b.inst.dispose();
    expect(observable.errorListenerCount).toBe(0);
  });

  it('keeps event history bounded while resources churn and get collected', async ({ device }) => {
    makeObservableDevice(device);
    const root = tgpu.initFromDevice({ device, unstable_instrumentation: { historySize: 8 } });
    const inst = root['~unstable'].instrumentation!;

    for (let i = 0; i < 500; i++) {
      root.unwrap(root.createBuffer(d.f32).$usage('uniform'));
    }
    for (let i = 0; i < 5; i++) {
      await flush();
      gc();
    }

    expect(inst.history()).toHaveLength(8);
    expect(inst.getSnapshot().counters.droppedEvents).toBe(492);
    expect(inst.getSnapshot().resources.length).toBeLessThan(500);
  });
});

// Viability gate: the lifecycle claims, as durable mock-device tests (the same claims are checked on a
// real device by real-gpu/page/viability.ts).
describe('lifecycle under sustained use', () => {
  it('keeps history at its bound over 40 000 events and accounts for every eviction', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device, { historySize: 256 });

    for (let i = 0; i < 20_000; i++) {
      const buffer = root.createBuffer(d.f32).$usage('uniform');
      root.unwrap(buffer);
      buffer.destroy();
    }

    const history = inst.history();
    expect(events).toHaveLength(40_000);
    expect(history).toHaveLength(256);
    expect(history.map((e) => e.seq)).toEqual(Array.from({ length: 256 }, (_, i) => 39_745 + i));
    expect(inst.getSnapshot().counters.droppedEvents).toBe(40_000 - 256);
    expect(inst.getSnapshot().resources).toEqual([]);
  });

  it('does not count destroyed-then-collected resources as leaked', async ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    (() => {
      for (let i = 0; i < 50; i++) {
        const buffer = root.createBuffer(d.f32).$usage('uniform');
        root.unwrap(buffer);
        buffer.destroy();
      }
    })();

    for (let i = 0; i < 10; i++) {
      await flush();
      gc();
    }

    expect(inst.getSnapshot().counters.collectedWithoutDestroy).toBe(0);
  });

  it('produces nothing after dispose(): in-flight diagnostics, device errors, device loss, later resources', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    root.createComputePipeline({ compute: computeMain }).initSync(); // diagnostics still in flight
    const before = events.length;

    inst.dispose();
    observable.fireError('late');
    observable.lose('unknown', 'late');
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));
    await flush();

    expect(before).toBe(1);
    expect(events).toHaveLength(before);
    expect(inst.history()).toHaveLength(before);
  });

  it('keeps unsubscribed and independent consumers independent over many events', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    let kept = 0;
    let dropped = 0;
    let thrown = 0;
    inst.subscribe(() => kept++);
    const off = inst.subscribe(() => dropped++);
    inst.subscribe(() => {
      thrown++;
      throw new Error('consumer bug');
    });

    for (let i = 0; i < 100; i++) root.unwrap(root.createBuffer(d.f32).$usage('uniform'));
    off();
    for (let i = 0; i < 100; i++) root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect({ kept, dropped, thrown }).toEqual({ kept: 200, dropped: 100, thrown: 200 });
    expect(inst.getSnapshot().counters.listenerErrors).toBe(200);
  });
});
