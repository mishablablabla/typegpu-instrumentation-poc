/**
 * Consumer 2: folds the same stream into a different, structured projection: findings grouped by
 * the question they answer. It is a pure reducer plus a thin subscription wrapper, so it also shows
 * the stream is enough to rebuild state without calling `getSnapshot`.
 */
import type {
  TgpuInstrumentation,
  TgpuInstrumentationEvent,
} from '../../../src/core/instrumentation/types.ts';

type Source = Pick<TgpuInstrumentation, 'subscribe' | 'history'>;

export type DiagnosticsIndex = {
  /** "Why does my first frame hitch?" Pipelines compiled synchronously on first use. */
  readonly lazyCompiles: readonly { id: number; label: string | null; cpuMs: number }[];
  /** "My async pipeline rejected, why?" The error plus the generated WGSL that was rejected. */
  readonly failedCompiles: readonly {
    id: number;
    label: string | null;
    errorType: string;
    message: string;
    wgsl: string | null;
  }[];
  /** "What did the compiler say?" With the offending line of the generated WGSL attached. */
  readonly shaderProblems: readonly {
    pipelineId: number;
    label: string | null;
    messages: readonly { type: string; message: string; wgslLine: string | null }[];
  }[];
  /** "Why is nothing drawn?" Device errors, plus bind groups that point at unknown resources. */
  readonly deviceErrors: readonly { errorType: string; message: string }[];
  readonly bindGroupsWithUnknownResources: readonly {
    id: number;
    label: string | null;
    entries: readonly string[];
  }[];
  /** "Am I leaking?" Rebuilt from events only: materialized and not destroyed. */
  readonly liveResources: readonly { id: number; label: string | null; resource: string }[];
  readonly deviceLost: { reason: string; message: string } | null;
  readonly leakedAtRootDestroy: { buffers: number; textures: number } | null;
};

type State = {
  lazy: DiagnosticsIndex['lazyCompiles'][number][];
  failed: DiagnosticsIndex['failedCompiles'][number][];
  wgslByPipeline: Map<number, { label: string | null; wgsl: string | null }>;
  problems: DiagnosticsIndex['shaderProblems'][number][];
  errors: DiagnosticsIndex['deviceErrors'][number][];
  unknownBindings: DiagnosticsIndex['bindGroupsWithUnknownResources'][number][];
  live: Map<number, DiagnosticsIndex['liveResources'][number]>;
  lost: DiagnosticsIndex['deviceLost'];
  leaked: DiagnosticsIndex['leakedAtRootDestroy'];
};

export function emptyState(): State {
  return {
    lazy: [],
    failed: [],
    wgslByPipeline: new Map(),
    problems: [],
    errors: [],
    unknownBindings: [],
    live: new Map(),
    lost: null,
    leaked: null,
  };
}

export function reduce(state: State, e: TgpuInstrumentationEvent): void {
  switch (e.type) {
    case 'resource-materialized':
      state.live.set(e.id, { id: e.id, label: e.label, resource: e.resource });
      break;
    case 'resource-destroyed':
      state.live.delete(e.id);
      break;
    case 'pipeline-created':
      state.wgslByPipeline.set(e.id, { label: e.label, wgsl: e.wgsl });
      if (e.trigger === 'lazy') {
        state.lazy.push({ id: e.id, label: e.label, cpuMs: e.resolveMs + e.createMs });
      }
      break;
    case 'pipeline-creation-failed':
      state.wgslByPipeline.set(e.id, { label: e.label, wgsl: e.wgsl });
      state.failed.push({
        id: e.id,
        label: e.label,
        errorType: e.errorType,
        message: e.message,
        wgsl: e.wgsl,
      });
      break;
    case 'shader-diagnostics': {
      if (e.messages.length === 0) {
        break;
      }
      const pipeline = state.wgslByPipeline.get(e.pipelineId);
      const lines = pipeline?.wgsl?.split('\n');
      state.problems.push({
        pipelineId: e.pipelineId,
        label: pipeline?.label ?? null,
        messages: e.messages.map((m) => ({
          type: m.type,
          message: m.message,
          wgslLine: lines?.[m.lineNum - 1]?.trim() ?? null,
        })),
      });
      break;
    }
    case 'bind-group-created': {
      const unknown = e.entries.filter((x) => x.resourceId === null).map((x) => x.name);
      if (unknown.length > 0) {
        state.unknownBindings.push({ id: e.id, label: e.label, entries: unknown });
      }
      break;
    }
    case 'device-error':
      state.errors.push({ errorType: e.errorType, message: e.message });
      break;
    case 'device-lost':
      state.lost = { reason: e.reason, message: e.message };
      break;
    case 'root-destroyed':
      state.leaked = { buffers: e.liveBuffers, textures: e.liveTextures };
      break;
  }
}

export function toIndex(state: State): DiagnosticsIndex {
  return {
    lazyCompiles: state.lazy,
    failedCompiles: state.failed,
    shaderProblems: state.problems,
    deviceErrors: state.errors,
    bindGroupsWithUnknownResources: state.unknownBindings,
    liveResources: [...state.live.values()],
    deviceLost: state.lost,
    leakedAtRootDestroy: state.leaked,
  };
}

export function createDiagnosticsIndex(source: Source) {
  const state = emptyState();
  for (const e of source.history()) {
    reduce(state, e);
  }
  const unsubscribe = source.subscribe((e) => reduce(state, e));
  return { index: () => toIndex(state), dispose: unsubscribe };
}
