/**
 * Consumer 1: turns the event stream into human-readable lines (what a console reporter or a
 * log panel would show). Depends only on the public data model; knows nothing about TypeGPU internals.
 */
import type {
  TgpuInstrumentation,
  TgpuInstrumentationEvent,
  TgpuInstrumentationSnapshot,
} from '../../../src/core/instrumentation/types.ts';

type Source = Pick<TgpuInstrumentation, 'subscribe' | 'history'>;

const name = (label: string | null, id: number) => `${label ?? '<unnamed>'}#${id}`;

export function formatEvent(e: TgpuInstrumentationEvent): string {
  const head = `[${String(e.seq).padStart(3, '0')}]`;
  switch (e.type) {
    case 'resource-materialized':
      return (
        `${head} ${e.resource} ${name(e.label, e.id)} materialized` +
        (e.resource === 'buffer' ? ` (${e.sizeBytes} B)` : ` (${e.format} ${e.size.join('x')})`)
      );
    case 'resource-destroyed':
      return `${head} ${e.resource} ${name(e.label, e.id)} destroyed`;
    case 'bind-group-created': {
      const entries = e.entries
        .map((x) => `${x.name}=${x.resourceId === null ? '?' : `#${x.resourceId}`}`)
        .join(', ');
      return `${head} bind group #${e.id} of layout ${e.label ?? '<unnamed>'}#${e.layoutId} (${e.origin}) { ${entries} }`;
    }
    case 'pipeline-created':
      return (
        // A synchronous creation cannot know whether the pipeline is valid (observed on a real device:
        // an invalid shader still produces this event), so only the async success may say "compiled".
        `${head} ${e.pipeline} pipeline ${name(e.label, e.id)} ${e.trigger === 'initAsync' ? 'compiled' : 'created'} [${e.trigger}] ` +
        `resolve ${e.resolveMs.toFixed(2)} ms (CPU), create ${e.createMs.toFixed(2)} ms (CPU), ${e.wgslLength} chars of WGSL`
      );
    case 'pipeline-creation-failed':
      return (
        `${head} ${e.pipeline} pipeline ${name(e.label, e.id)} creation FAILED [${e.trigger}, ${e.phase}] ` +
        `${e.errorType}: ${failureText(e.phase, e.message)}` +
        (e.wgslLength > 0 ? ` (${e.wgslLength} chars of WGSL)` : '')
      );
    case 'shader-diagnostics':
      return e.messages.length === 0
        ? `${head} pipeline #${e.pipelineId} shader: no compiler messages`
        : `${head} pipeline #${e.pipelineId} shader: ` +
            e.messages
              .map((m) => `${m.type} at WGSL ${m.lineNum}:${m.linePos}: ${m.message}`)
              .join('; ');
    case 'device-error':
      // Browser messages span several lines (source excerpt, call stack); the first line names the problem.
      return `${head} DEVICE ERROR ${e.errorType}: ${e.message.split('\n')[0]}`;
    case 'device-lost':
      return `${head} DEVICE LOST (${e.reason}): ${e.message}`;
    case 'root-destroyed':
      return `${head} root destroyed (own device: ${e.ownDevice}), still alive: ${e.liveBuffers} buffers, ${e.liveTextures} textures`;
  }
}

/**
 * A resolution error lists the failing tree one level per line, and the cause is on the last line, so all lines
 * matter; an async creation error is a browser message whose first line is its summary.
 */
function failureText(phase: 'resolve' | 'create', message: string): string {
  const lines = message.split('\n').filter((line) => line.trim() !== '');
  const text =
    phase === 'resolve' ? lines.map((l) => l.replace(/^- /, '')).join(' > ') : (lines[0] ?? '');
  return text.length > 300 ? `${text.slice(0, 297)}...` : text;
}

/** Names that occur on at least this many live objects are called out: they are what a leak or per-frame creation looks like. */
const REPEATED_NAME_THRESHOLD = 3;

function repeatedNames(items: readonly { label: string | null }[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const { label } of items) {
    if (label !== null) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts].filter(([, n]) => n >= REPEATED_NAME_THRESHOLD);
}

export function formatSnapshot(s: TgpuInstrumentationSnapshot): string[] {
  const lines = [
    `${s.resources.length} live resources, ${s.pipelines.length} pipelines, ${s.bindGroups.length} bind groups`,
  ];
  for (const r of s.resources) {
    lines.push(
      `  ${r.resource} ${name(r.label, r.id)}` +
        (r.writes === null ? '' : `: ${r.writes} writes, ${r.bytesWritten} B written`),
    );
  }
  for (const p of s.pipelines) {
    lines.push(
      `  ${p.pipeline} pipeline ${name(p.label, p.id)}: ${p.dispatches} dispatches, ${p.draws} draws`,
    );
  }
  for (const [label, n] of repeatedNames(s.pipelines)) {
    lines.push(
      `  note: ${n} live pipelines are named '${label}': created repeatedly (each creation costs CPU)?`,
    );
  }
  for (const [label, n] of repeatedNames(s.resources)) {
    lines.push(
      `  note: ${n} live resources are named '${label}': created repeatedly and never destroyed?`,
    );
  }
  if (s.retainedFailures.length > 0) {
    lines.push(
      `  ${s.retainedFailures.length} retained failure(s), most recent: ${s.retainedFailures.at(-1)?.type}`,
    );
  }
  lines.push(`  submits via TypeGPU encoders: ${s.counters.submits}`);
  lines.push(`  not available: ${s.unavailable.join(', ')}`);
  return lines;
}

/** Replays the retained history, then follows the live stream. */
export function createTextReport(source: Source) {
  const lines = source.history().map(formatEvent);
  const unsubscribe = source.subscribe((e) => lines.push(formatEvent(e)));
  return { lines: () => [...lines], dispose: unsubscribe };
}
