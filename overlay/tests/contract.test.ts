import { createInstrumentation, estimateEventBytes } from 'typegpu/unstable-instrumentation';
import * as v8 from 'node:v8';
import * as vm from 'node:vm';
import { afterEach, describe, expect, vi } from 'vitest';
import { d, tgpu } from 'typegpu';
import { it } from 'typegpu-testing-utility';
import type {
  TgpuInstrumentationEvent,
  TgpuInstrumentationOptions,
} from '../../src/core/instrumentation/types.ts';
import {
  computeMain,
  flush,
  layout,
  makeObservableDevice,
  makePlainDevice,
  ofType,
  typesOf,
} from './support.ts';

v8.setFlagsFromString('--expose-gc');
const gc = vm.runInNewContext('gc') as () => void;

function setup(device: GPUDevice, options: TgpuInstrumentationOptions = {}) {
  makeObservableDevice(device);
  const root = tgpu.initFromDevice({
    device,
    unstable_instrumentation: createInstrumentation(options),
  });
  const inst = root['~unstable'].instrumentation!;
  const events: TgpuInstrumentationEvent[] = [];
  inst.subscribe((e) => events.push(e));
  return { root, inst, events };
}

/** Materializes one buffer; its event carries `label`, so the label length controls the payload size. */
function materialize(root: ReturnType<typeof setup>['root'], label: string) {
  const buffer = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage').$name(label);
  root.unwrap(buffer);
  return buffer;
}

describe('event schema v2', () => {
  it('stamps the schema version on events and snapshots', async ({ device }) => {
    const { root, inst, events } = setup(device);
    materialize(root, 'a');
    root.createComputePipeline({ compute: computeMain }).initSync();
    await flush();

    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.v === 2)).toBe(true);
    expect(inst.getSnapshot().v).toBe(2);
  });

  it('says what a pipeline creation does and does not prove', async ({ device }) => {
    const { root, events } = setup(device);
    root.createComputePipeline({ compute: computeMain }).initSync();
    const values = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage');
    root
      .createComputePipeline({ compute: computeMain })
      .with(root.createBindGroup(layout, { values }))
      .dispatchWorkgroups(1);
    await root.createComputePipeline({ compute: computeMain }).initAsync();
    await flush();

    expect(ofType(events, 'pipeline-created').map((e) => [e.trigger, e.validation])).toEqual([
      ['initSync', 'deferred'],
      ['lazy', 'deferred'],
      ['initAsync', 'passed'],
    ]);
    expect(typesOf(events)).not.toContain('pipeline-compiled');
  });
});

describe('history is bounded by bytes as well as by count', () => {
  it('evicts the oldest events until the estimated payload fits, and accounts for every byte', ({
    device,
  }) => {
    const { root, inst } = setup(device, { historySize: 1000, historyMaxBytes: 5_000 });
    for (let i = 0; i < 30; i++) {
      materialize(root, `buffer-${i}-${'x'.repeat(400)}`);
    }

    const history = inst.history();
    const retained = history.reduce((sum, e) => sum + estimateEventBytes(e), 0);
    const counters = inst.getSnapshot().counters;

    expect(retained).toBeLessThanOrEqual(5_000);
    expect(history.length).toBeLessThan(30);
    expect(history.length).toBeGreaterThan(0);
    // The survivors are the newest ones, contiguous.
    expect(history.map((e) => e.seq)).toEqual(
      Array.from({ length: history.length }, (_, i) => 30 - history.length + i + 1),
    );
    expect(counters.historyBytes).toBe(retained);
    expect(counters.droppedEvents).toBe(30 - history.length);
    // Independent accounting: everything ever emitted is either retained or dropped.
    expect(counters.historyBytes + counters.droppedBytes).toBeGreaterThan(30 * 800);
  });

  it('always keeps the newest event, even when it alone exceeds the bound', ({ device }) => {
    const { root, inst } = setup(device, { historyMaxBytes: 100 });
    materialize(root, 'small');
    materialize(root, 'y'.repeat(10_000));

    const history = inst.history();
    expect(history).toHaveLength(1);
    expect((history[0] as { label: string }).label).toHaveLength(10_000);
    expect(inst.getSnapshot().counters.droppedEvents).toBe(1);
  });

  it('releases evicted events (history arrays do not grow with the number of events ever emitted)', ({
    device,
  }) => {
    const { root, inst } = setup(device, { historySize: 4 });
    for (let i = 0; i < 5_000; i++) {
      materialize(root, `b${i}`);
    }
    expect(inst.history().map((e) => e.seq)).toEqual([4997, 4998, 4999, 5000]);
    expect(inst.getSnapshot().counters.droppedEvents).toBe(4996);
  });

  it('keeps no history for historySize 0 but still counts what it dropped', ({ device }) => {
    const { root, inst, events } = setup(device, { historySize: 0 });
    materialize(root, 'a');
    expect(inst.history()).toEqual([]);
    expect(events).toHaveLength(1);
    const counters = inst.getSnapshot().counters;
    expect(counters.droppedEvents).toBe(1);
    expect(counters.droppedBytes).toBeGreaterThan(0);
    expect(counters.historyBytes).toBe(0);
  });

  it('can drop the generated WGSL and keep only its length', async ({ device }) => {
    const full = setup(device);
    full.root.createComputePipeline({ compute: computeMain }).initSync();
    const fullEvent = ofType(full.events, 'pipeline-created')[0]!;

    const lean = setup(device, { captureSource: false });
    lean.root.createComputePipeline({ compute: computeMain }).initSync();
    await flush();
    const leanEvent = ofType(lean.events, 'pipeline-created')[0]!;

    expect(typeof fullEvent.wgsl).toBe('string');
    expect(leanEvent.wgsl).toBeNull();
    expect(leanEvent.wgslLength).toBe(fullEvent.wgslLength);
    expect(leanEvent.wgslLength).toBeGreaterThan(50);
    expect(lean.inst.getSnapshot().pipelines[0]).toMatchObject({
      wgsl: null,
      wgslLength: fullEvent.wgslLength,
    });
    expect(estimateEventBytes(leanEvent)).toBeLessThan(estimateEventBytes(fullEvent));
  });
});

describe('options are validated when instrumentation is attached', () => {
  it.for([
    ['historySize', Number.NaN],
    ['historySize', -1],
    ['historySize', 1.5],
    ['historySize', Number.POSITIVE_INFINITY],
    ['historySize', 1_000_001],
    ['historySize', '5'],
    ['historyMaxBytes', -1],
    ['historyMaxBytes', Number.NaN],
    ['historyMaxBytes', 0.5],
  ] as const)(
    'rejects %s = %s with a RangeError naming the option',
    ([name, value], { device }) => {
      let error: unknown;
      try {
        tgpu.initFromDevice({
          device,
          unstable_instrumentation: createInstrumentation({ [name]: value } as never),
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(RangeError);
      expect((error as Error).message).toContain(name);
    },
  );

  it('accepts the boundaries', ({ device }) => {
    for (const options of [
      { historySize: 0 },
      { historySize: 1_000_000 },
      { historyMaxBytes: 0 },
    ]) {
      const root = tgpu.initFromDevice({
        device,
        unstable_instrumentation: createInstrumentation(options),
      });
      expect(root['~unstable'].instrumentation?.enabled).toBe(true);
    }
  });
});

describe('delivery order and re-entrancy', () => {
  it('queues events caused by a listener, so every listener sees seq order and is never re-entered', ({
    device,
  }) => {
    const { root, inst } = setup(device);
    const seenByA: number[] = [];
    const seenByB: number[] = [];
    let depth = 0;
    let maxDepth = 0;
    let created = false;

    inst.subscribe((event) => {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
      seenByA.push(event.seq);
      if (!created) {
        created = true;
        // Calling back into TypeGPU from a listener: its event must wait for the current delivery.
        materialize(root, 'from-listener');
      }
      depth--;
    });
    inst.subscribe((event) => seenByB.push(event.seq));

    materialize(root, 'first');

    expect(maxDepth).toBe(1);
    expect(seenByA).toEqual([1, 2]);
    expect(seenByB).toEqual([1, 2]);
    expect(inst.history().map((e) => e.seq)).toEqual([1, 2]);
  });

  it('cuts off a subscriber that keeps causing events, without hanging or throwing into the app', ({
    device,
  }) => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const { root, inst } = setup(device);
    let delivered = 0;
    inst.subscribe(() => {
      delivered++;
      materialize(root, `storm-${delivered}`);
    });

    expect(() => materialize(root, 'start')).not.toThrow();

    const counters = inst.getSnapshot().counters;
    expect(delivered).toBeGreaterThan(100);
    expect(delivered).toBeLessThanOrEqual(10_001);
    expect(counters.listenerErrors).toBeGreaterThanOrEqual(1);
    expect(counters.lastListenerError).toMatch(/keeps causing new events/);
    expect(reportError).toHaveBeenCalledTimes(1);
  });
});

describe('events are immutable', () => {
  it('rejects mutation of events, nested arrays and shared history objects', ({ device }) => {
    const { root, inst, events } = setup(device);
    const layoutGroup = tgpu.bindGroupLayout({ values: { storage: d.arrayOf(d.f32, 4) } });
    const buffer = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage');
    const bindGroup = root.createBindGroup(layoutGroup, { values: buffer });
    root.unwrap(bindGroup);

    const [first] = events;
    expect(Object.isFrozen(first)).toBe(true);
    expect(() => {
      (first as { label: unknown }).label = 'tampered';
    }).toThrowError(TypeError);

    const group = ofType(events, 'bind-group-created')[0]!;
    expect(Object.isFrozen(group.entries)).toBe(true);
    expect(() => (group.entries as unknown[]).push({})).toThrowError(TypeError);

    // What another consumer sees through history() is the same, unmodified data.
    expect(inst.history()).toEqual(events);
  });

  it('gives snapshots that a consumer may keep and mutate without affecting the next snapshot', ({
    device,
  }) => {
    const { root, inst } = setup(device);
    materialize(root, 'a');
    const first = inst.getSnapshot();
    (first.resources as unknown[]).length = 0;
    expect(inst.getSnapshot().resources).toHaveLength(1);
  });
});

describe('subscriber failures are isolated and observable', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not let a throwing subscriber reach the application or other subscribers', ({
    device,
  }) => {
    vi.stubGlobal('reportError', vi.fn());
    const { root, inst, events } = setup(device);
    inst.subscribe(() => {
      throw new Error('reporter exploded');
    });
    const late: number[] = [];
    inst.subscribe((e) => late.push(e.seq));

    expect(() => materialize(root, 'a')).not.toThrow();

    expect(events).toHaveLength(1);
    expect(late).toEqual([1]);
    expect(inst.getSnapshot().counters.listenerErrors).toBe(1);
    expect(inst.getSnapshot().counters.lastListenerError).toBe('Error: reporter exploded');
  });

  it('surfaces each distinct failure once, up to a limit, and keeps counting the rest', ({
    device,
  }) => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const { root, inst } = setup(device);
    let n = 0;
    inst.subscribe(() => {
      throw new Error(`failure ${n++ % 8}`);
    });

    for (let i = 0; i < 40; i++) {
      materialize(root, `b${i}`);
    }

    expect(inst.getSnapshot().counters.listenerErrors).toBe(40);
    // 8 distinct messages, but at most 5 are surfaced.
    expect(reportError).toHaveBeenCalledTimes(5);
    const messages = reportError.mock.calls.map(([error]) => (error as Error).message);
    expect(new Set(messages).size).toBe(5);
  });

  it('falls back to console.error where reportError does not exist', ({ device }) => {
    vi.stubGlobal('reportError', undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { root, inst } = setup(device);
    inst.subscribe(() => {
      throw new Error('boom');
    });
    materialize(root, 'a');
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(String(consoleError.mock.calls[0]?.[0])).toContain('instrumentation');
  });

  it('survives an environment whose own error reporting throws', ({ device }) => {
    vi.stubGlobal('reportError', () => {
      throw new Error('handler of handlers failed');
    });
    const { root, inst } = setup(device);
    inst.subscribe(() => {
      throw new Error('boom');
    });
    expect(() => materialize(root, 'a')).not.toThrow();
    expect(inst.getSnapshot().counters.listenerErrors).toBe(1);
  });
});

describe('the registry stays bounded under churn nobody ever inspects', () => {
  const heap = () => {
    gc();
    gc();
    return process.memoryUsage().heapUsed;
  };

  it('forgets collected resources without a snapshot or a finalizer callback', async () => {
    const root = tgpu.initFromDevice({
      device: makePlainDevice(),
      unstable_instrumentation: createInstrumentation({ historySize: 0 }),
    });
    const inst = root['~unstable'].instrumentation!;
    const batch = async () => {
      gc(); // the previous batch's buffers are really dead now, so the sweeps below can drop their records
      for (let i = 0; i < 4_000; i++) {
        root.unwrap(root.createBuffer(d.f32).$usage('uniform')); // dropped at once, never destroyed
      }
      await flush();
    };

    // Records are released when their object is collected. With a collection before every batch the registry
    // must hold about one batch of records, whatever the total: measure growth from 40 000 to 200 000 buffers.
    // (Left to V8's own cadence it would follow it up to a high-water mark of tens of MiB, which is bounded
    // too but not a deterministic thing to assert.)
    for (let i = 0; i < 10; i++) {
      await batch();
    }
    const plateau = heap();
    for (let i = 0; i < 40; i++) {
      await batch();
    }
    const grown = heap() - plateau;

    // A registry that never released anything would add about 24 MiB over those 160 000 buffers.
    expect(grown).toBeLessThan(4 * 1024 * 1024);
    // Sweeps ran on their own: almost all 200 000 are already accounted as collected before this snapshot.
    const snapshot = inst.getSnapshot();
    expect(snapshot.counters.collectedWithoutDestroy).toBeGreaterThan(190_000);
    expect(snapshot.resources.length).toBeLessThan(5_000);
  }, 60_000);
});
