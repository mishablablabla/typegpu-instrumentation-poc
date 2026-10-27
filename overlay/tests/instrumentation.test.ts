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
