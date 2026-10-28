// Snippets of the documentation page: reading events and the snapshot (see quickstart.ts for how they are extracted).
// #region events
import type { TgpuInstrumentation } from 'typegpu/unstable-instrumentation';

export function watch(inst: TgpuInstrumentation) {
  // Called synchronously, in `seq` order, for every event after this point.
  const unsubscribe = inst.subscribe((event) => {
    switch (event.type) {
      case 'pipeline-creation-failed':
        console.error(`${event.label ?? 'pipeline'} [${event.phase}]: ${event.message}`);
        break;
      case 'shader-diagnostics':
        for (const m of event.messages) {
          console.error(`pipeline #${event.pipelineId}, generated WGSL ${m.lineNum}:${m.linePos}: ${m.message}`);
        }
        break;
      case 'device-error':
        console.error(event.errorType, event.message);
        break;
    }
  });

  // Events from before the subscription are still in the history.
  for (const event of inst.history()) {
    console.log(event.seq, event.type);
  }
  return unsubscribe;
}
// #endregion events

// #region snapshot
export function report(inst: TgpuInstrumentation) {
  const snapshot = inst.getSnapshot();

  for (const buffer of snapshot.resources) {
    console.log(buffer.resource, buffer.label, buffer.sizeBytes, `${buffer.writes} writes`);
  }
  for (const pipeline of snapshot.pipelines) {
    console.log(pipeline.label, pipeline.trigger, `${pipeline.dispatches} dispatches, ${pipeline.draws} draws`);
  }
  // Creation failures and device loss stay here even after the history has moved on.
  console.log(snapshot.retainedFailures.length, 'failures retained');
  // What this layer cannot report.
  console.log(snapshot.unavailable);
}
// #endregion snapshot
