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
    case 'pipeline-compiled':
      return (
        `${head} ${e.pipeline} pipeline ${name(e.label, e.id)} compiled [${e.trigger}] ` +
        `resolve ${e.resolveMs.toFixed(2)} ms (CPU), create ${e.createMs.toFixed(2)} ms (CPU), ${e.wgsl.length} chars of WGSL`
      );
    case 'pipeline-compile-failed':
      return (
        `${head} ${e.pipeline} pipeline ${name(e.label, e.id)} FAILED to compile [${e.trigger}] ` +
        `${e.errorType}: ${e.message.split('\n')[0]} (${e.wgsl.length} chars of WGSL kept)`
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
