/**
 * What the layer does NOT see, pinned as characterisation tests. Each one is a blind spot listed in
 * `snapshot.unavailable` and the event contract in README.md. If one starts failing because a hook was added, that is
 * good news: update the contract and the `unavailable` list in the same change.
 */
import { describe, expect } from 'vitest';
import { d } from 'typegpu';
import { restoreResource, snapshotResource } from 'typegpu/~internal';
import { it } from 'typegpu-testing-utility';
import {
  computeMain,
  enabledRoot,
  layout,
  makeObservableDevice,
  mockOf,
  ofType,
  typesOf,
} from './support.ts';

describe('known blind spots', () => {
  it('restored (precompiled) pipelines: no creation event, dispatches uncounted', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    const group = root.createBindGroup(layout, {
      values: root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage'),
    });
    const original = root.createComputePipeline({ compute: computeMain });
    original.with(group).dispatchWorkgroups(1);

    const restored = restoreResource(snapshotResource(original)!, {
      getRoot: () => root,
    }) as typeof original;
    restored.with(group).dispatchWorkgroups(1);
    restored.with(group).dispatchWorkgroups(1);

    expect(ofType(events, 'pipeline-created')).toHaveLength(1);
    expect(inst.getSnapshot().pipelines).toHaveLength(1);
    expect(inst.getSnapshot().pipelines[0]?.dispatches).toBe(1);
  });

  it('helper paths (buffer.clear/copyFrom/read, mipmap generation, query sets) create GPU objects and submit unseen', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    const a = root.createBuffer(d.arrayOf(d.u32, 4)).$usage('storage');
    const b = root.createBuffer(d.arrayOf(d.u32, 4)).$usage('storage');
    root.unwrap(a);
    root.unwrap(b);
    const eventsBefore = events.length;
    const mock = mockOf(device);
    const buffersBefore = mock.createBuffer.mock.calls.length;

    a.clear();
    a.copyFrom(b as never);
    a.read().catch(() => {});
    root
      .createTexture({ size: [8, 8], format: 'rgba8unorm', mipLevelCount: 3 })
      .$usage('render', 'sampled')
      .generateMipmaps();
    root.createQuerySet('timestamp', 2).resolve();

    expect(mock.queue.submit.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(inst.getSnapshot().counters.submits).toBe(0);
    expect(mock.createBuffer.mock.calls.length - buffersBefore).toBeGreaterThanOrEqual(2);
    // Only the texture TypeGPU itself unwrapped appears; the staging/resolve buffers never do.
    expect(
      ofType(events.slice(eventsBefore), 'resource-materialized').every(
        (e) => e.resource === 'texture',
      ),
    ).toBe(true);
  });

  it('samplers, texture views and bind group layouts produce no events', ({ device }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    root.unwrap(root.createSampler({ magFilter: 'linear' }));
    const texture = root.createTexture({ size: [4, 4], format: 'rgba8unorm' }).$usage('sampled');
    root.unwrap(texture.createView(d.texture2d(d.f32)));
    root.unwrap(layout);

    expect(typesOf(events)).toEqual(['resource-materialized']); // the texture only
    expect(mockOf(device).createBindGroupLayout).toHaveBeenCalledTimes(1);
  });

  it('wrapped GPUBuffers: writes and destruction through TypeGPU are invisible', ({ device }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    const raw = device.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE });
    const wrapped = root.createBuffer(d.arrayOf(d.u32, 4), raw).$usage('storage');
    wrapped.write([1, 2, 3, 4]);
    wrapped.destroy();

    expect(events).toEqual([]);
    expect(inst.getSnapshot().resources).toEqual([]);
  });

  it('bindGroup.unwrap(root) called directly bypasses the per-root cache and the hook', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, events } = enabledRoot(device);
    const group = root.createBindGroup(layout, {
      values: root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage'),
    });

    group.unwrap(root);
    group.unwrap(root);
    expect(mockOf(device).createBindGroup).toHaveBeenCalledTimes(2);
    expect(ofType(events, 'bind-group-created')).toEqual([]);

    root.unwrap(group); // the regular path creates a third GPU object and the first, only, event
    expect(mockOf(device).createBindGroup).toHaveBeenCalledTimes(3);
    expect(ofType(events, 'bind-group-created')).toHaveLength(1);
  });
});
