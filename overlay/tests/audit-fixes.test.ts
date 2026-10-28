/**
 * Regression tests for defects found by the second independent audit (2026-10-28). Each test was written
 * against the layer as it was before the fix and failed there (A-1 ... A-5 are the audit's ids D-1, D-5,
 * D-7, D-9 and the not-thenable `device.lost` case of D-7). A-6 is the open deviation "device-lost while disabled".
 */
import { describe, expect, vi } from 'vitest';
import { d, tgpu } from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
import { it } from 'typegpu-testing-utility';
import {
  enabledRoot,
  flush,
  internalsOf,
  layout,
  makeObservableDevice,
  mockOf,
  typesOf,
} from './support.ts';

const slot = tgpu.slot<number>();
const brokenCompute = tgpu.computeFn({ workgroupSize: [1] })(() => {
  'use gpu';
  layout.$.values[0] = slot.$;
});

describe('exotic thrown values', () => {
  it('A-1 a subscriber throwing a null-prototype object is isolated: others still receive the event and the layer stays on', ({
    device,
  }) => {
    makeObservableDevice(device);
    const surfaced = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { root, inst } = enabledRoot(device);
    inst.subscribe(() => {
      throw Object.create(null); // String() of this throws
    });
    const received: string[] = [];
    inst.subscribe((e) => received.push(e.type));

    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    expect(received).toEqual(['resource-materialized', 'resource-materialized']);
    const counters = inst.getSnapshot().counters;
    expect(counters.internalErrors).toBe(0);
    expect(counters.listenerErrors).toBeGreaterThanOrEqual(1);
    expect(counters.lastListenerError).toBe('[object Object]'); // the second-level fallback of the text conversion
    expect(inst.enabled).toBe(true);
    surfaced.mockRestore();
  });

  it('A-1b an application error that cannot be stringified is rethrown unchanged and does not switch the layer off', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst } = enabledRoot(device);
    const hostile = new Proxy(
      {},
      {
        get() {
          throw new Error('getter trap');
        },
        getPrototypeOf() {
          throw new Error('prototype trap');
        },
      },
    );
    // the failure path of a hook is fed an arbitrary thrown value by the patch; the hub must stay total
    const sink = internalsOf(root).instrumentation as unknown as {
      pipelineResolutionFailed(...args: unknown[]): void;
    };
    expect(() => sink.pipelineResolutionFailed({}, 'compute', 'lazy', hostile)).not.toThrow();
    // an error whose `message` cannot be stringified still yields an event that names its type
    const unprintableMessage = { message: Object.create(null) };
    sink.pipelineResolutionFailed({}, 'compute', 'lazy', unprintableMessage);
    const failures = inst.getSnapshot().retainedFailures;
    expect(failures.at(-1)).toMatchObject({ errorType: 'Object', message: '[object Object]' });
    expect(inst.getSnapshot().counters.internalErrors).toBe(0);
  });
});

describe('device loss retention', () => {
  it('A-2 the retained device-lost event survives byte pressure from later failures', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const { root, inst } = enabledRoot(device, { historyMaxBytes: 2000 });
    observable.lose('unknown', 'gpu crashed');
    await flush();
    expect(inst.getSnapshot().retainedFailures.map((e) => e.type)).toEqual(['device-lost']);

    for (let i = 0; i < 5; i++) {
      expect(() =>
        root.createComputePipeline({ compute: brokenCompute }).$name(`big${i}`).initSync(),
      ).toThrow();
    }

    const retained = inst.getSnapshot().retainedFailures.map((e) => e.type);
    expect(retained).toContain('device-lost');
    expect(retained).toContain('pipeline-creation-failed');
  });
});

describe('device loss retention (single oversized failure)', () => {
  it('A-2b when the newest failure alone exceeds the byte bound, the device-lost event is still kept next to it', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const { root, inst } = enabledRoot(device, { historyMaxBytes: 300 });
    observable.lose('unknown', 'gpu crashed');
    await flush();

    expect(() =>
      root.createComputePipeline({ compute: brokenCompute }).$name('huge').initSync(),
    ).toThrow();

    expect(inst.getSnapshot().retainedFailures.map((e) => e.type)).toEqual([
      'device-lost',
      'pipeline-creation-failed',
    ]);
  });
});

describe('root-destroyed is emitted once', () => {
  it('A-3 a root-destroyed listener that triggers the destroy hook again does not duplicate the event', ({
    device,
  }) => {
    makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    // TypeGPU's own `root.destroy()` is idempotent; this drives the hub-level hook the way a re-entrant caller would
    const sink = internalsOf(root).instrumentation as unknown as {
      rootDestroyed(own: boolean): void;
    };
    let calls = 0;
    inst.subscribe((e) => {
      if (e.type === 'root-destroyed' && calls++ < 3) {
        sink.rootDestroyed(false);
      }
    });

    sink.rootDestroyed(false);

    expect(typesOf(events).filter((t) => t === 'root-destroyed')).toHaveLength(1);
    // history stays readable after the layer is disposed: the duplicate used to land there
    expect(typesOf(inst.history()).filter((t) => t === 'root-destroyed')).toHaveLength(1);
  });
});

describe('options fail early and precisely', () => {
  it('A-4 createInstrumentation() validates its options itself, before any root or device exists', () => {
    expect(() => createInstrumentation({ historySize: -1 })).toThrow(RangeError);
    expect(() => createInstrumentation({ historyMaxBytes: Infinity })).toThrow(RangeError);
    expect(() => createInstrumentation({ captureSource: 'no' as unknown as boolean })).toThrow(
      /captureSource must be a boolean/,
    );
    expect(() => createInstrumentation(null as unknown as undefined)).toThrow(
      /options must be an object or undefined, got null/,
    );
    expect(() => createInstrumentation()).not.toThrow();
    expect(() => createInstrumentation({ historySize: 0, captureSource: false })).not.toThrow();
  });

  it('A-4b a bad option never reaches tgpu.init, so no device is requested for it', async ({
    device,
  }) => {
    const request = vi.spyOn(navigator.gpu, 'requestAdapter');
    await expect(
      (async () =>
        tgpu.init({ unstable_instrumentation: createInstrumentation({ historySize: 1.5 }) }))(),
    ).rejects.toThrow(RangeError);
    expect(request).not.toHaveBeenCalled();
    expect(device).toBeDefined();
    request.mockRestore();
  });

  it('A-5 a device whose `lost` is not thenable does not break attaching', ({ device }) => {
    const mock = mockOf(device) as unknown as Record<string, unknown>;
    mock.lost = {};
    expect(() => enabledRoot(device)).not.toThrow();
  });
});

describe('device loss while disabled', () => {
  it('A-6 a loss that happens while disabled stays silent, and is announced once when the layer is enabled again', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const { inst, events } = enabledRoot(device);

    inst.disable();
    observable.lose('unknown', 'gone while disabled');
    await flush();
    // disable() keeps its promise: nothing is emitted while off
    expect(events).toEqual([]);
    expect(inst.history()).toEqual([]);

    inst.enable();
    expect(typesOf(events)).toEqual(['device-lost']);
    expect(events[0]).toMatchObject({
      type: 'device-lost',
      reason: 'unknown',
      message: 'gone while disabled',
    });
    expect(inst.history().map((e) => e.type)).toEqual(['device-lost']);
    expect(inst.getSnapshot().retainedFailures.map((e) => e.type)).toEqual(['device-lost']);

    // exactly once, however often the layer is toggled afterwards
    inst.disable();
    inst.enable();
    inst.enable();
    expect(typesOf(events)).toEqual(['device-lost']);
  });

  it('A-6b a loss while disabled does not break destroy, and nothing is announced for a root that is gone', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const { root, inst, events } = enabledRoot(device);
    inst.disable();
    observable.lose('destroyed', 'bye');
    await flush();
    root.destroy();
    inst.enable();
    expect(typesOf(events)).not.toContain('device-lost');
  });

  it('A-6c a loss while enabled is unchanged: reported immediately, and enable() adds nothing', async ({
    device,
  }) => {
    const observable = makeObservableDevice(device);
    const { inst, events } = enabledRoot(device);
    observable.lose('unknown', 'live');
    await flush();
    expect(typesOf(events)).toEqual(['device-lost']);
    inst.disable();
    inst.enable();
    expect(typesOf(events)).toEqual(['device-lost']);
  });
});
