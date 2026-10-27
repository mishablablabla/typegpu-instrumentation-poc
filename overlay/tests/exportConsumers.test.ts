import { describe, expect } from 'vitest';
import { d, tgpu } from 'typegpu';
import { it } from 'typegpu-testing-utility';
import { attachConsoleReporter } from './consumers/consoleReporter.ts';
import { createJsonlExport, JSONL_FORMAT } from './consumers/jsonlExport.ts';
import { computeMain, flush, layout, makeObservableDevice } from './support.ts';

function run(device: GPUDevice) {
  makeObservableDevice(device);
  const root = tgpu.initFromDevice({ device, unstable_instrumentation: true });
  const inst = root['~unstable'].instrumentation!;
  return { root, inst };
}

function scenario(root: ReturnType<typeof run>['root']) {
  const values = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage').$name('values');
  const bindGroup = root.createBindGroup(layout, { values });
  root.createComputePipeline({ compute: computeMain }).with(bindGroup).dispatchWorkgroups(1);
}

describe('console reporter', () => {
  it('prints one prefixed line per event, in order, through the given sink', async ({ device }) => {
    const { root, inst } = run(device);
    const lines: string[] = [];
    const reporter = attachConsoleReporter(inst, { log: (l) => lines.push(l), prefix: '> ' });

    scenario(root);
    await flush();
    reporter.printSnapshot();

    const events = lines.filter((l) => /^> \[\d{3}\]/.test(l));
    expect(events.map((l) => l.slice(2, 7))).toEqual(['[001]', '[002]', '[003]', '[004]']);
    expect(lines.every((l) => l.startsWith('> '))).toBe(true);
    expect(lines.some((l) => l.includes('compute pipeline') && l.includes('[lazy]'))).toBe(true);
    expect(lines.some((l) => l.includes('not available: gpuExecutionTime'))).toBe(true);
  });

  it('replays earlier events unless told not to, and stops after dispose', ({ device }) => {
    const { root, inst } = run(device);
    scenario(root);

    const replayed: string[] = [];
    const quiet: string[] = [];
    attachConsoleReporter(inst, { log: (l) => replayed.push(l) });
    const off = attachConsoleReporter(inst, { log: (l) => quiet.push(l), replayHistory: false });
    off.dispose();
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    // 3 replayed (compile, buffer, bind group; diagnostics settle asynchronously) + 1 live after attaching
    expect(replayed.length).toBe(4);
    expect(quiet).toEqual([]);
  });

  it('uses console.log when no sink is given', ({ device }) => {
    const { root, inst } = run(device);
    const printed: unknown[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => printed.push(args.join(' '));
    try {
      attachConsoleReporter(inst);
      root.unwrap(root.createBuffer(d.f32).$usage('uniform'));
    } finally {
      console.log = original;
    }
    expect(printed).toHaveLength(1);
  });
});

describe('JSONL export', () => {
  it('writes a header, exactly the emitted events, and a tagged snapshot; every line parses', async ({
    device,
  }) => {
    const { root, inst } = run(device);
    const emitted: unknown[] = [];
    inst.subscribe((e) => emitted.push(e));
    const exported = createJsonlExport(inst);

    scenario(root);
    await flush();
    exported.addSnapshot();

    const records = exported
      .toString()
      .trimEnd()
      .split('\n')
      .map((l) => JSON.parse(l));
    expect(records[0]).toEqual({
      record: 'header',
      format: JSONL_FORMAT,
      version: 1,
      eventSchema: 1,
    });
    const events = records.filter((r) => r.record === 'event').map((r) => r.event);
    expect(events).toEqual(emitted);
    expect(events.map((e: { seq: number }) => e.seq)).toEqual([1, 2, 3, 4]);
    const snapshot = records.at(-1);
    expect(snapshot).toMatchObject({ record: 'snapshot', afterSeq: 4 });
    expect(snapshot.snapshot.pipelines[0]).toMatchObject({ dispatches: 1 });
    expect(exported.toString().endsWith('\n')).toBe(true);
  });

  it('includes events that happened before it was created, and has no filesystem or DOM dependency', ({
    device,
  }) => {
    const { root, inst } = run(device);
    root.unwrap(root.createBuffer(d.f32).$usage('uniform'));

    const exported = createJsonlExport(inst);

    expect(exported.lines()).toHaveLength(2);
    expect(JSON.parse(exported.lines()[1] as string).event.type).toBe('resource-materialized');
  });
});
