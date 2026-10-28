/**
 * The live runner: lazily loaded, so the typegpu runtime is fetched only when a visitor presses Run.
 * It is an ordinary consumer of the instrumentation contract: it creates the layer, subscribes, and reads the snapshot.
 * Nothing below the contract (the core, the hub) knows that Angular exists.
 */
import { tgpu, d, type TgpuRoot } from 'typegpu';
import { createInstrumentation } from 'typegpu/unstable-instrumentation';
import type { TgpuInstrumentationEvent } from 'typegpu/unstable-instrumentation';
import brokenShader from './generated/broken-shader';
import { createJsonlExport } from './generated/jsonlExport';
import { formatEvent, formatSnapshot } from './generated/textReport';

export type LiveScenarioId = 'broken-shader' | 'resolve-error' | 'per-frame-churn';

export interface LiveEventRow {
  readonly seq: number;
  readonly type: string;
  readonly line: string;
  readonly json: string;
}

export interface LiveResult {
  readonly adapter: { vendor: string; architecture: string; isFallbackAdapter: boolean } | null;
  readonly summary: readonly string[];
  readonly jsonl: string;
  readonly threw: string | null;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Plain-WGSL variants of the recorded programs. The recorded ones use 'use gpu' functions, which need a build plugin;
// these produce the same *kind* of failure and the same events without it.
async function resolveError(root: TgpuRoot) {
  const multiplier = tgpu.slot<number>();
  const kernel = tgpu
    .computeFn({ workgroupSize: [1] })`{ let m = multiplier; }`
    .$uses({ multiplier });
  try {
    root.createComputePipeline({ compute: kernel }).$name('needsSlot').dispatchWorkgroups(1);
  } catch (error) {
    return `dispatch threw ${(error as Error).constructor.name}`;
  }
  return 'dispatch did not throw';
}

async function perFrameChurn(root: TgpuRoot) {
  const noop = tgpu.computeFn({ workgroupSize: [1] })`{ }`;
  const steady = root.createComputePipeline({ compute: noop }).$name('steady');
  const keep: unknown[] = [];
  for (let frame = 0; frame < 5; frame++) {
    const scratch = root.createBuffer(d.arrayOf(d.f32, 4)).$usage('storage').$name('scratch');
    root.unwrap(scratch); // materialize it, as a bind group would
    keep.push(scratch);
    steady.dispatchWorkgroups(1);
    // the mistake: a pipeline object per frame
    root.createComputePipeline({ compute: noop }).$name('perFrame').dispatchWorkgroups(1);
  }
  return `${keep.length} scratch buffers still referenced`;
}

async function broken(root: TgpuRoot) {
  await brokenShader(root);
  return 'initAsync was awaited; see the events';
}

const SCENARIOS: Record<LiveScenarioId, (root: TgpuRoot) => Promise<string>> = {
  'broken-shader': broken,
  'resolve-error': resolveError,
  'per-frame-churn': perFrameChurn,
};

export async function adapterOf(): Promise<LiveResult['adapter']> {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter) return null;
  const info = adapter.info;
  return {
    vendor: info?.vendor || 'unknown',
    architecture: info?.architecture || 'unknown',
    isFallbackAdapter: Boolean((adapter as { isFallbackAdapter?: boolean }).isFallbackAdapter ?? info?.isFallbackAdapter),
  };
}

export async function runLive(
  id: LiveScenarioId,
  onEvent: (row: LiveEventRow) => void,
): Promise<LiveResult> {
  const adapter = await adapterOf();
  const root = await tgpu.init({ unstable_instrumentation: createInstrumentation({ historySize: 512 }) });
  const inst = root['~unstable'].instrumentation;
  if (!inst) throw new Error('instrumentation option was ignored: this TypeGPU build has no hooks');
  const exported = createJsonlExport(inst);
  const off = inst.subscribe((e: TgpuInstrumentationEvent) =>
    onEvent({ seq: e.seq, type: e.type, line: formatEvent(e), json: JSON.stringify(e, null, 2) }),
  );

  let threw: string | null = null;
  const summary: string[] = [];
  try {
    summary.push(`[scenario] ${await SCENARIOS[id](root)}`);
    await root.device.queue.onSubmittedWorkDone();
    await sleep(150); // compiler diagnostics settle asynchronously
  } catch (caught) {
    threw = `${(caught as Error).name}: ${(caught as Error).message}`;
  }

  summary.push(...formatSnapshot(inst.getSnapshot()));
  exported.addSnapshot();
  root.destroy();
  for (let i = 0; i < 40 && !inst.history().some((e) => e.type === 'device-lost'); i++) await sleep(50);
  const jsonl = exported.lines().join('\n') + '\n';
  off();
  exported.dispose();
  return { adapter, summary, jsonl, threw };
}
