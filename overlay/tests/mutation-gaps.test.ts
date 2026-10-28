/**
 * Tests added after mutation testing (see the mutation report): each one kills at least one mutant that
 * the original suite let survive. The `Mxx` tags name the mutants (one-line, plausible code changes);
 * a test is written against externally observable behaviour, not against the implementation.
 *
 * The last block documents real defects found along the way with `it.fails`: they pass while the defect
 * exists and start failing once it is fixed, at which point they should become ordinary `it`s.
 */
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
import * as v8 from 'node:v8';
import * as vm from 'node:vm';
import { describe, expect, vi } from 'vitest';
import { d, tgpu } from 'typegpu';
import { restoreResource, snapshotResource } from 'typegpu/~internal';
import { it } from 'typegpu-testing-utility';
import type { TgpuInstrumentationEvent } from '../../src/core/instrumentation/types.ts';
import { createDiagnosticsIndex } from './consumers/diagnosticsIndex.ts';
import { createJsonlExport } from './consumers/jsonlExport.ts';
import { createTextReport, formatSnapshot } from './consumers/textReport.ts';
import {
  computeMain,
  enabledRoot,
  flush,
  fragmentMain,
  layout,
  makeObservableDevice,
  mockOf,
  ofType,
  typesOf,
  vertexMain,
} from './support.ts';

v8.setFlagsFromString('--expose-gc');
const gc = vm.runInNewContext('gc') as () => void;

type DeviceMock = ReturnType<typeof mockOf>;

const touchBuffer = (root: ReturnType<typeof enabledRoot>['root']) =>
  root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

function renderPipelineOf(root: ReturnType<typeof enabledRoot>['root']) {
  return root.createRenderPipeline({
    vertex: vertexMain,
    fragment: fragmentMain,
    targets: { format: 'rgba8unorm' },
  });
}

async function collectUntil(isDone: () => boolean) {
  for (let i = 0; i < 30 && !isDone(); i++) {
    await flush();
    gc();
  }
}

describe('history ring', () => {
  // M02
  it('counts every event as dropped when there is no history at all', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device, { historySize: 0 });

    for (let i = 0; i < 3; i++) {
      touchBuffer(root);
    }

    expect(inst.getSnapshot().counters.droppedEvents).toBe(3);
  });

  // M07
  it('keeps 256 events by default', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);

    for (let i = 0; i < 300; i++) {
      touchBuffer(root);
    }

    const history = inst.history();
    expect(history).toHaveLength(256);
    expect(history[0]?.seq).toBe(45);
    expect(history.at(-1)?.seq).toBe(300);
    expect(inst.getSnapshot().counters.droppedEvents).toBe(44);
  });

  // M08
  it('has an event in history() by the time a listener receives it', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device, { historySize: 2 });
    const lastInHistory: (number | undefined)[] = [];
    const delivered: number[] = [];
    inst.subscribe((e) => {
      delivered.push(e.seq);
      lastInHistory.push(inst.history().at(-1)?.seq);
    });

    for (let i = 0; i < 4; i++) {
      touchBuffer(root);
    }

    expect(lastInHistory).toEqual(delivered);
  });
});

describe('subscription edge cases', () => {
  // M09
  it('does not deliver the current event to a listener that subscribed while it was delivered', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const late: number[] = [];
    let added = false;
    inst.subscribe(() => {
      if (!added) {
        added = true;
        inst.subscribe((e) => late.push(e.seq));
      }
    });

    touchBuffer(root);
    touchBuffer(root);

    expect(late).toEqual([2]);
  });

  // M10
  it('keeps delivering to the next listener when one unsubscribes itself', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const off = inst.subscribe(() => off());
    const next: number[] = [];
    inst.subscribe((e) => next.push(e.seq));

    touchBuffer(root);
    touchBuffer(root);

    expect(next).toEqual([1, 2]);
  });

  // M70
  it('keeps delivering to later listeners after an earlier one throws', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    inst.subscribe(() => {
      throw new Error('consumer bug');
    });
    const later: number[] = [];
    inst.subscribe((e) => later.push(e.seq));

    touchBuffer(root);
    touchBuffer(root);

    expect(later).toEqual([1, 2]);
    expect(inst.getSnapshot().counters.listenerErrors).toBe(2);
  });

  // M18
  it('dispose() lets go of its subscribers', async ({ device }) => {
    makeObservableDevice(device);
    const { inst } = enabledRoot(device);
    const ref = (() => {
      const listener = () => {};
      inst.subscribe(listener);
      return new WeakRef(listener);
    })();
    for (let i = 0; i < 3; i++) {
      await flush();
      gc();
    }
    expect(ref.deref()).toBeDefined(); // a live hub keeps its subscribers

    inst.dispose();
    await collectUntil(() => ref.deref() === undefined);

    expect(ref.deref()).toBeUndefined();
  });
});

describe('enable() and disable()', () => {
  // M171, M178
  it('keeps the history across disable() and enable()', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    touchBuffer(root);

    inst.disable();
    expect(inst.history().map((e) => e.seq)).toEqual([1]);
    inst.enable();

    expect(inst.history().map((e) => e.seq)).toEqual([1]);
  });

  // M172
  it('keeps seq increasing across disable() and enable()', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    touchBuffer(root);
    touchBuffer(root);

    inst.disable();
    touchBuffer(root);
    inst.enable();
    touchBuffer(root);

    expect(events.map((e) => e.seq)).toEqual([1, 2, 3]);
    expect(inst.history().map((e) => e.seq)).toEqual([1, 2, 3]);
  });
});

describe('device events', () => {
  // M22
  it('stays silent about device loss while disabled (it is announced on enable, see A-6)', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const { inst, events } = enabledRoot(device);

    inst.disable();
    observable.lose('unknown', 'gone');
    await flush();

    expect(events).toEqual([]);
    expect(inst.history()).toEqual([]);
  });

  // M23, M24
  it('gives an error event without an error object defined fields', ({ device }) => {
    const observable = makeObservableDevice(device);
    const { events } = enabledRoot(device);
    const listener = observable.addEventListener.mock.calls[0]?.[1] as (event: unknown) => void;

    listener({});

    expect(ofType(events, 'device-error')).toEqual([
      expect.objectContaining({ errorType: 'unknown', message: '' }),
    ]);
  });

  // M74
  it('listens to the device again for a root created after the last one was disposed', ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const first = enabledRoot(device);
    first.inst.dispose();
    expect(observable.errorListenerCount).toBe(0);

    const second = enabledRoot(device);
    observable.fireError('after re-attach');

    expect(observable.errorListenerCount).toBe(1);
    expect(ofType(second.events, 'device-error')).toHaveLength(1);
    expect(ofType(first.events, 'device-error')).toHaveLength(0);
  });

  // M77, M78
  it('reports a device loss exactly once to every root on the device', async ({ device }) => {
    const observable = makeObservableDevice(device);
    const a = enabledRoot(device);
    const b = enabledRoot(device);
    const c = enabledRoot(device);

    observable.lose('destroyed', 'Device was destroyed.');
    await flush();

    for (const { events } of [a, b, c]) {
      expect(ofType(events, 'device-lost')).toEqual([
        expect.objectContaining({ reason: 'destroyed' }),
      ]);
    }
  });

  // M79
  it('works on a device that is not an event target and has no lost promise', ({ device }) => {
    // no makeObservableDevice: the shared mock has neither addEventListener nor lost
    const { root, events } = enabledRoot(device);

    expect(() => touchBuffer(root)).not.toThrow();

    expect(typesOf(events)).toEqual(['resource-materialized']);
  });
});

describe('resources', () => {
  // M25, M26, M107
  it('counts exactly the bytes TypeGPU asked the device to write', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const buffer = root.createBuffer(d.arrayOf(d.u32, 4)).$usage('storage').$name('data');
    root.unwrap(buffer);
    const writes = mockOf(device).queue.writeBuffer;
    const written = () =>
      writes.mock.calls.reduce(
        (sum, call) =>
          sum + ((call[4] as number | undefined) ?? (call[2] as ArrayBuffer).byteLength),
        0,
      );
    const stats = () => {
      const [data] = inst.getSnapshot().resources.filter((r) => r.label === 'data');
      return { writes: data?.writes, bytesWritten: data?.bytesWritten };
    };

    expect(stats()).toEqual({ writes: 0, bytesWritten: 0 });

    buffer.write([1, 2, 3, 4]);
    expect(written()).toBe(16);
    expect(stats()).toEqual({ writes: 1, bytesWritten: 16 });

    const before = written();
    buffer.patch([{ idx: 2, value: 9 }] as never);
    expect(written() - before).toBeGreaterThan(0);
    expect(stats()).toEqual({ writes: 2, bytesWritten: written() });
  });

  // M163, M164
  it('does not count writes that go straight into a mapped buffer (documented blind spot)', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const buffer = root.createBuffer(d.arrayOf(d.u32, 4)).$usage('storage');
    (root.unwrap(buffer) as unknown as { mapState: string }).mapState = 'mapped';

    buffer.write([1, 2, 3, 4]);
    buffer.patch([{ idx: 1, value: 9 }] as never);

    expect(inst.getSnapshot().resources[0]).toMatchObject({ writes: 0, bytesWritten: 0 });
    expect(mockOf(device).queue.writeBuffer).not.toHaveBeenCalled();
  });

  // M30, M31, M32, M33
  it('reports the texture descriptor that was given to the device', ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const volume = root
      .createTexture({
        size: [8, 4, 2],
        format: 'rgba16float',
        dimension: '3d',
        mipLevelCount: 2,
      })
      .$usage('sampled', 'storage')
      .$name('volume');
    const msaa = root
      .createTexture({ size: [16, 16], format: 'bgra8unorm', sampleCount: 4 })
      .$usage('render')
      .$name('msaa');
    root.unwrap(volume);
    root.unwrap(msaa);

    const created = mockOf(device).createTexture.mock.calls.map(
      (call) => call[0] as GPUTextureDescriptor,
    );
    const reported = ofType(events, 'resource-materialized').filter(
      (e) => e.resource === 'texture',
    );
    expect(reported).toHaveLength(2);
    expect(reported[0]).toMatchObject({
      label: 'volume',
      format: 'rgba16float',
      size: [8, 4, 2],
      dimension: '3d',
      mipLevelCount: 2,
      sampleCount: 1,
    });
    expect(reported[1]).toMatchObject({
      label: 'msaa',
      format: 'bgra8unorm',
      dimension: '2d',
      sampleCount: 4,
    });
    for (const [i, event] of reported.entries()) {
      expect(event.usage).toBe(created[i]?.usage);
      expect(event.usage).toBeGreaterThan(0);
    }
  });

  // M112
  it('reports the destruction of a texture', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    const texture = root
      .createTexture({ size: [4, 4], format: 'rgba8unorm' })
      .$usage('sampled')
      .$name('gone');
    root.unwrap(texture);
    const id = ofType(events, 'resource-materialized')[0]?.id;

    texture.destroy();

    expect(ofType(events, 'resource-destroyed')).toEqual([
      expect.objectContaining({ id, resource: 'texture', label: 'gone' }),
    ]);
    expect(inst.getSnapshot().resources).toEqual([]);
  });

  // M71
  it('says in the snapshot whether recording is on', ({ device }) => {
    makeObservableDevice(device);
    const { inst } = enabledRoot(device);
    expect(inst.getSnapshot().enabled).toBe(true);

    inst.disable();
    expect(inst.getSnapshot().enabled).toBe(false);

    inst.enable();
    expect(inst.getSnapshot().enabled).toBe(true);

    inst.dispose();
    expect(inst.getSnapshot().enabled).toBe(false);
  });
});

describe('root.destroy()', () => {
  // M61
  it('counts live textures and buffers separately', ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const liveTexture = root
      .createTexture({ size: [4, 4], format: 'rgba8unorm' })
      .$usage('sampled');
    const deadTexture = root
      .createTexture({ size: [4, 4], format: 'rgba8unorm' })
      .$usage('sampled');
    root.unwrap(liveTexture);
    root.unwrap(deadTexture);
    deadTexture.destroy();
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    root.destroy();

    expect(ofType(events, 'root-destroyed')).toEqual([
      expect.objectContaining({ liveBuffers: 1, liveTextures: 1 }),
    ]);
  });

  // M63
  it('does not count a resource that was garbage-collected as alive', async ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const kept = root.createBuffer(d.f32).$usage('uniform');
    root.unwrap(kept);
    const ref = (() => {
      const buffer = root.createBuffer(d.f32).$usage('uniform');
      root.unwrap(buffer);
      return new WeakRef(buffer);
    })();

    // No await between the collection and root.destroy(): finalizers run on a later turn, so the
    // hub's record for the collected buffer still exists at this point.
    for (let i = 0; i < 30; i++) {
      await flush();
      gc();
      if (ref.deref() === undefined) {
        break;
      }
    }
    expect(ref.deref()).toBeUndefined();
    root.destroy();

    expect(ofType(events, 'root-destroyed')).toEqual([expect.objectContaining({ liveBuffers: 1 })]);
    expect(kept).toBeDefined();
  });

  // M62
  it('records nothing while disabled', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);

    inst.disable();
    root.destroy();

    expect(events).toEqual([]);
    expect(inst.history()).toEqual([]);
  });
});

describe('bind groups', () => {
  const sceneLayout = tgpu
    .bindGroupLayout({
      params: { uniform: d.f32 },
      values: { storage: d.arrayOf(d.f32, 4), access: 'mutable' },
      unused: null,
      color: { texture: d.texture2d(d.f32) },
      target: { storageTexture: d.textureStorage2d('rgba8unorm', 'writeonly' as never) },
      smp: { sampler: 'filtering' },
    })
    .$name('sceneLayout');

  // M35, M36, M37, M38, M39, M40, M43
  it('classifies every entry kind and attributes each tracked resource', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    const params = root.createBuffer(d.f32).$usage('uniform');
    const values = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage');
    const colorTexture = root
      .createTexture({ size: [4, 4], format: 'rgba8unorm' })
      .$usage('sampled');
    const targetTexture = root
      .createTexture({ size: [4, 4], format: 'rgba8unorm' })
      .$usage('storage');
    const bindGroup = root.createBindGroup(sceneLayout, {
      params,
      // a binding that wraps a buffer, not the buffer itself
      values: values.as('mutable'),
      color: colorTexture.createView(d.texture2d(d.f32)),
      target: targetTexture.createView(d.textureStorage2d('rgba8unorm', 'writeonly' as never)),
      smp: root.createSampler({ minFilter: 'linear' }),
    } as never);

    root.unwrap(bindGroup);

    const materialized = ofType(events, 'resource-materialized');
    const idOf = (label: string) => materialized.find((e) => e.label === label)?.id;
    const [group] = ofType(events, 'bind-group-created');
    expect(group?.label).toBe('sceneLayout');
    expect(group?.entries).toEqual([
      { name: 'params', kind: 'buffer', resourceId: idOf('params') },
      { name: 'values', kind: 'buffer', resourceId: idOf('values') },
      { name: 'color', kind: 'texture', resourceId: idOf('colorTexture') },
      { name: 'target', kind: 'texture', resourceId: idOf('targetTexture') },
      { name: 'smp', kind: 'sampler', resourceId: null },
    ]);
    expect(group?.entries.every((e) => e.kind === 'sampler' || e.resourceId !== null)).toBe(true);
    expect(inst.getSnapshot().bindGroups[0]?.entries).toEqual(group?.entries);
  });

  // M44
  it('reports null, not a made-up id, for a TypeGPU buffer that was created while disabled', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    inst.disable();
    const hidden = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage');
    root.unwrap(hidden);
    inst.enable();

    root.unwrap(root.createBindGroup(layout, { values: hidden }));

    expect(ofType(events, 'bind-group-created')[0]?.entries).toEqual([
      { name: 'values', kind: 'buffer', resourceId: null },
    ]);
  });

  // M72, M145, M146
  it('marks a bind group restored around an existing GPUBindGroup as adopted', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    const group = root.createBindGroup(layout, {
      values: root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage'),
    });
    root.unwrap(group);
    const snapshot = snapshotResource(group);
    const restored = restoreResource(snapshot as never, { getRoot: () => root }) as typeof group;

    root.unwrap(restored);

    expect(ofType(events, 'bind-group-created').map((e) => e.origin)).toEqual([
      'created',
      'adopted',
    ]);
    expect(inst.getSnapshot().bindGroups.map((g) => g.origin)).toEqual(['created', 'adopted']);
  });
});

describe('pipelines', () => {
  // M45
  it('does not record a pipeline whose async creation finishes after disable()', async ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    let finish!: (pipeline: unknown) => void;
    mockOf(device).createComputePipelineAsync.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const pending = root.createComputePipeline({ compute: computeMain }).initAsync();

    inst.disable();
    finish({ label: '', getBindGroupLayout: () => 'mockBindGroupLayout' });
    await pending;
    await flush();

    expect(events).toEqual([]);
    expect(inst.getSnapshot().pipelines).toEqual([]);
  });

  // M46, M53
  it('names the layouts of a compiled and of a failed pipeline', async ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const pipeline = root.createComputePipeline({ compute: computeMain });
    mockOf(device).createComputePipelineAsync.mockRejectedValueOnce(new Error('invalid'));
    root.unwrap(
      root.createBindGroup(layout, {
        values: root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage'),
      }),
    );
    const [group] = ofType(events, 'bind-group-created');

    await expect(pipeline.initAsync()).rejects.toThrow('invalid');
    await pipeline.initAsync();

    const [failed] = ofType(events, 'pipeline-creation-failed');
    const [compiled] = ofType(events, 'pipeline-created');
    for (const event of [failed, compiled]) {
      expect(event?.layoutIds).toEqual([group?.layoutId]);
      expect(event?.layoutLabels).toEqual(['layout']);
    }
  });

  // M139, M140
  it('keeps layouts and WGSL of a failed render pipeline', async ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const paramsLayout = tgpu.bindGroupLayout({ params: { uniform: d.f32 } });
    const fragment = tgpu.fragmentFn({ out: d.vec4f })(() => {
      'use gpu';
      return d.vec4f(paramsLayout.$.params, 0, 0, 1);
    });
    root.unwrap(
      root.createBindGroup(paramsLayout, { params: root.createBuffer(d.f32).$usage('uniform') }),
    );
    mockOf(device).createRenderPipelineAsync.mockRejectedValueOnce(new Error('invalid'));
    const pipeline = root.createRenderPipeline({
      vertex: vertexMain,
      fragment,
      targets: { format: 'rgba8unorm' },
    });

    await expect(pipeline.initAsync()).rejects.toThrow('invalid');

    const [group] = ofType(events, 'bind-group-created');
    const [failed] = ofType(events, 'pipeline-creation-failed');
    expect(failed?.layoutIds).toEqual([group?.layoutId]);
    expect(failed?.layoutLabels).toEqual(['paramsLayout']);
    expect(failed?.wgsl).toContain('fn vertexMain');
    expect(failed?.wgsl).toContain('fn fragment');
  });

  // M173, M174
  it('lists the layouts of a pipeline in group-index order, with matching labels', ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const first = tgpu
      .bindGroupLayout({ a: { storage: d.arrayOf(d.f32, 1), access: 'mutable' } })
      .$idx(0)
      .$name('firstLayout');
    const second = tgpu
      .bindGroupLayout({ b: { uniform: d.f32 } })
      .$idx(1)
      .$name('secondLayout');
    const compute = tgpu.computeFn({ workgroupSize: [1] })(() => {
      'use gpu';
      first.$.a[0] = second.$.b; // the layout with the higher index is used first
    });
    root.unwrap(root.createBindGroup(second, { b: root.createBuffer(d.f32).$usage('uniform') }));
    root.unwrap(
      root.createBindGroup(first, { a: root.createBuffer(d.arrayOf(d.f32, 1)).$usage('storage') }),
    );
    const groups = ofType(events, 'bind-group-created');
    const layoutIdOf = (label: string) => groups.find((g) => g.label === label)?.layoutId;

    root.createComputePipeline({ compute }).initSync();

    const [compiled] = ofType(events, 'pipeline-created');
    expect(compiled?.layoutIds).toEqual([layoutIdOf('firstLayout'), layoutIdOf('secondLayout')]);
    expect(compiled?.layoutLabels).toEqual(['firstLayout', 'secondLayout']);
  });

  // M51
  it('gives a pipeline that fails repeatedly the same id, and another pipeline another id', async ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const mock = mockOf(device);
    mock.createComputePipelineAsync
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockRejectedValueOnce(new Error('third'));
    const a = root.createComputePipeline({ compute: computeMain });
    const b = root.createComputePipeline({ compute: computeMain });

    await a.initAsync().catch(() => {});
    await a.initAsync().catch(() => {});
    await b.initAsync().catch(() => {});

    const ids = ofType(events, 'pipeline-creation-failed').map((e) => e.id);
    expect(ids).toHaveLength(3);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[2]).not.toBe(ids[0]);
  });

  // M52
  it('reports a rejection that is not an Error', async ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    mockOf(device).createComputePipelineAsync.mockRejectedValueOnce('boom');

    await expect(root.createComputePipeline({ compute: computeMain }).initAsync()).rejects.toBe(
      'boom',
    );

    expect(ofType(events, 'pipeline-creation-failed')).toEqual([
      expect.objectContaining({ errorType: 'String', message: 'boom' }),
    ]);
  });

  // M134, M135, M137
  it('tells explicit initSync, explicit initAsync and lazy compilation of a render pipeline apart', async ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);

    renderPipelineOf(root).initSync();
    await renderPipelineOf(root).initAsync();
    const texture = root.createTexture({ size: [4, 4], format: 'rgba8unorm' }).$usage('render');
    renderPipelineOf(root)
      .withColorAttachment({ view: texture, loadOp: 'clear', storeOp: 'store' })
      .draw(3);

    expect(ofType(events, 'pipeline-created').map((e) => [e.pipeline, e.trigger])).toEqual([
      ['render', 'initSync'],
      ['render', 'initAsync'],
      ['render', 'lazy'],
    ]);
  });

  // M58, M117
  it('counts a draw of a lazily compiled pipeline in an explicit pass, but not after disable()', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const pipeline = renderPipelineOf(root);
    const pass = root['~unstable'].createCommandEncoder().beginRenderPass({ colorAttachments: [] });
    const inPass = pipeline.with(pass);

    inPass.draw(3); // compiles here
    inst.disable();
    inPass.draw(3);
    inPass.draw(3);
    inst.enable();

    expect(inst.getSnapshot().pipelines).toEqual([
      expect.objectContaining({ pipeline: 'render', trigger: 'lazy', draws: 1, dispatches: 0 }),
    ]);
  });
});

describe('CPU timing', () => {
  function withClock(start: number) {
    const clock = { now: start };
    const spy = vi.spyOn(performance, 'now').mockImplementation(() => clock.now);
    return { clock, restore: () => spy.mockRestore() };
  }

  // M47, M48, M98, M129, M142
  it('measures resolve and create separately, around the right calls', async ({ device }) => {
    makeObservableDevice(device);
    const mock = mockOf(device);
    const { clock, restore } = withClock(1000);
    try {
      // Time only passes inside these device calls.
      const shaderModule = mock.createShaderModule.getMockImplementation() as (
        d: unknown,
      ) => unknown;
      mock.createShaderModule.mockImplementation((descriptor: unknown) => {
        clock.now += 5;
        return shaderModule(descriptor);
      });
      mock.createComputePipeline.mockImplementation((descriptor: GPUComputePipelineDescriptor) => {
        clock.now += 7;
        return { label: descriptor.label ?? '', getBindGroupLayout: () => 'mockBindGroupLayout' };
      });
      mock.createRenderPipeline.mockImplementation(() => {
        clock.now += 11;
        return 'mockRenderPipeline';
      });
      const { root, inst, events } = enabledRoot(device);
      const index = createDiagnosticsIndex(inst);
      const values = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage');

      root
        .createComputePipeline({ compute: computeMain })
        .with(root.createBindGroup(layout, { values }))
        .dispatchWorkgroups(1); // lazy
      renderPipelineOf(root).initSync();

      const [compute, render] = ofType(events, 'pipeline-created');
      expect(compute).toMatchObject({ pipeline: 'compute', resolveMs: 0, createMs: 7 });
      expect(render).toMatchObject({ pipeline: 'render', resolveMs: 0, createMs: 11 });
      expect(inst.getSnapshot().pipelines.map((p) => [p.resolveMs, p.createMs])).toEqual([
        [0, 7],
        [0, 11],
      ]);
      expect(index.index().lazyCompiles).toEqual([expect.objectContaining({ cpuMs: 7 })]);
      // `t` is the same CPU clock: shader module (+5) and pipeline creation (+7, +11) advanced it
      expect([compute?.t, render?.t]).toEqual([1012, 1028]);
    } finally {
      restore();
    }
  });

  // M130
  it('reports time spent in resolve when time passes while resolving', async ({ device }) => {
    makeObservableDevice(device);
    let tick = 0;
    const spy = vi.spyOn(performance, 'now').mockImplementation(() => ++tick);
    try {
      const { root, events } = enabledRoot(device);

      root.createComputePipeline({ compute: computeMain }).initSync();
      renderPipelineOf(root).initSync();
      await root.createComputePipeline({ compute: computeMain }).initAsync();

      const compiled = ofType(events, 'pipeline-created');
      expect(compiled).toHaveLength(3);
      for (const event of compiled) {
        expect(event.resolveMs).toBeGreaterThan(0);
        expect(event.createMs).toBeGreaterThan(0);
      }
    } finally {
      spy.mockRestore();
    }
  });
});

describe('text report', () => {
  // M87, M88, M89, M90
  it('formats textures, destruction, first line of device errors and device loss', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const report = createTextReport(inst);
    const texture = root
      .createTexture({ size: [16, 8], format: 'rgba8unorm' })
      .$usage('sampled')
      .$name('tex');
    root.unwrap(texture);
    texture.destroy();

    observable.fireError('Binding is too small\n  at some stack\n  more detail');
    observable.lose('unknown', 'GPU process crashed');
    await flush();

    const lines = report.lines();
    expect(lines).toContainEqual(
      expect.stringMatching(/texture tex#1 materialized \(rgba8unorm 16x8\)$/),
    );
    expect(lines).toContainEqual(expect.stringMatching(/texture tex#1 destroyed$/));
    expect(lines).toContainEqual(
      expect.stringMatching(/DEVICE ERROR GPUValidationError: Binding is too small$/),
    );
    expect(lines).toContainEqual(
      expect.stringMatching(/DEVICE LOST \(unknown\): GPU process crashed$/),
    );
  });

  // M177
  it('shows <unnamed> for a resource without a label', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const report = createTextReport(inst);

    touchBuffer(root); // never named

    expect(report.lines()).toEqual(['[001] buffer <unnamed>#1 materialized (4 B)']);
  });

  // M92
  it('replays the history to a report that is attached late', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    touchBuffer(root);
    touchBuffer(root);

    const report = createTextReport(inst);
    touchBuffer(root);

    expect(report.lines().map((l) => l.slice(0, 5))).toEqual(['[001]', '[002]', '[003]']);
  });

  // M91, M93
  it('shows write counters and dispatch/draw counters in the snapshot lines', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const data = root.createBuffer(d.arrayOf(d.u32, 4)).$usage('storage').$name('data');
    data.write([1, 2, 3, 4]);
    const group = root.createBindGroup(layout, {
      values: root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage'),
    });
    const compute = root.createComputePipeline({ compute: computeMain }).$name('compute');
    compute.with(group).dispatchWorkgroups(1);
    compute.with(group).dispatchWorkgroups(1);

    const lines = formatSnapshot(inst.getSnapshot());

    expect(lines).toContainEqual(expect.stringMatching(/buffer data#\d+: 1 writes, 16 B written$/));
    expect(lines).toContainEqual(
      expect.stringMatching(/compute pipeline compute#\d+: 2 dispatches, 0 draws$/),
    );
  });

  // M97
  it('hands out a copy of its lines', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const report = createTextReport(inst);
    touchBuffer(root);

    report.lines().length = 0;

    expect(report.lines()).toHaveLength(1);
  });
});

describe('JSONL export', () => {
  // M95
  it('tags the snapshot with the last event seq even when history was evicted', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device, { historySize: 2 });
    for (let i = 0; i < 5; i++) {
      touchBuffer(root);
    }

    const exported = createJsonlExport(inst);
    touchBuffer(root);
    exported.addSnapshot();

    const records = exported.lines().map((l) => JSON.parse(l));
    expect(records.filter((r) => r.record === 'event').map((r) => r.event.seq)).toEqual([4, 5, 6]);
    expect(records.at(-1)).toMatchObject({ record: 'snapshot', afterSeq: 6 });
  });

  // M94
  it('stops collecting after dispose()', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const exported = createJsonlExport(inst);
    touchBuffer(root);

    exported.dispose();
    touchBuffer(root);

    expect(exported.lines()).toHaveLength(2); // header + the first event
  });

  // M97
  it('hands out a copy of its lines', ({ device }) => {
    makeObservableDevice(device);
    const { inst } = enabledRoot(device);
    const exported = createJsonlExport(inst);

    exported.lines().length = 0;

    expect(exported.lines()).toHaveLength(1);
  });
});

describe('diagnostics index', () => {
  // M99, M103
  it('lists neither an explicit initSync as lazy nor an empty compiler report as a problem', async ({
    device,
  }) => {
    makeObservableDevice(device); // compiler reports no messages
    const { root, inst } = enabledRoot(device);
    const index = createDiagnosticsIndex(inst);

    root.createComputePipeline({ compute: computeMain }).initSync();
    await flush();

    expect(typesOf(inst.history())).toEqual(['pipeline-created', 'shader-diagnostics']);
    expect(index.index().lazyCompiles).toEqual([]);
    expect(index.index().shaderProblems).toEqual([]);
  });

  // M101
  it('records the device loss', async ({ device }) => {
    const observable = makeObservableDevice(device);
    const { inst } = enabledRoot(device);
    const index = createDiagnosticsIndex(inst);

    observable.lose('destroyed', 'Device was destroyed.');
    await flush();

    expect(index.index().deviceLost).toEqual({
      reason: 'destroyed',
      message: 'Device was destroyed.',
    });
  });
});

// Real defects found by mutation testing. `it.fails`: green while the defect exists, red once fixed.
describe('defects found by mutation testing, now fixed', () => {
  it('unsubscribing one registration of a listener keeps its other registration', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const listener = vi.fn();
    const first = inst.subscribe(listener);
    inst.subscribe(listener);

    first();
    touchBuffer(root);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reports root-destroyed once when destroy() is called twice on an owned device', async ({
    device,
  }) => {
    makeObservableDevice(device);
    const root = await tgpu.init({ unstable_instrumentation: createInstrumentation() });
    const events: TgpuInstrumentationEvent[] = [];
    root['~unstable'].instrumentation!.subscribe((e) => events.push(e));

    root.destroy();
    root.destroy();

    expect(ofType(events, 'root-destroyed')).toHaveLength(1);
  });

  it('attributes a TypeGPU texture passed directly as a bind group entry', ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const texLayout = tgpu.bindGroupLayout({ tex: { texture: d.texture2d(d.f32) } });
    const texture = root.createTexture({ size: [4, 4], format: 'rgba8unorm' }).$usage('sampled');

    root.unwrap(root.createBindGroup(texLayout, { tex: texture } as never));

    const id = ofType(events, 'resource-materialized').find((e) => e.resource === 'texture')?.id;
    expect(id).toBeDefined();
    expect(ofType(events, 'bind-group-created')[0]?.entries).toEqual([
      { name: 'tex', kind: 'texture', resourceId: id },
    ]);
  });
});
