/**
 * Hand-written interpretation of the three recorded scenarios. Every statement is grounded in one of:
 * the recorded trace (`real-gpu/results/scenarios`), the control run with the layer off
 * (`real-gpu/results/control`), or docs/ECOSYSTEM-RESEARCH.md (which labels external-tool claims as documented,
 * not verified by us). Anything about what a UI *could* show is marked as proposed on the page.
 */
export type ScenarioId = 'broken-shader' | 'resolve-error' | 'per-frame-churn';
export type Classification = 'convenient' | 'available' | 'unique';

export interface ScenarioInfo {
  readonly title: string;
  readonly question: string;
  readonly symptom: string;
  readonly without: readonly string[];
  readonly native: readonly string[];
  readonly classification: Classification;
  readonly classificationLabel: string;
  readonly adds: readonly string[];
  readonly cannot: readonly string[];
  readonly futureUi: string;
}

export const SCENARIO_ORDER: readonly ScenarioId[] = ['broken-shader', 'resolve-error', 'per-frame-churn'];

export const SCENARIOS: Record<ScenarioId, ScenarioInfo> = {
  'broken-shader': {
    title: 'Broken shader',
    question: 'Why did initAsync() reject?',
    symptom: 'Raw WGSL calls a function that does not exist, so the browser rejects the shader.',
    without: [
      'The promise rejects with "[Invalid ShaderModule "broken - Shader"] is invalid due to a previous error." That text has no compiler detail, as the WebGPU specification allows.',
      'In the control run Chrome also printed a separate warning with the compiler message, the WGSL line, a caret and the label (see the captured output above).',
    ],
    native: [
      'The console warning is the main native signal and it is already good in Chrome 156.',
      'An app can wire uncapturederror and getCompilationInfo() itself, but the shader module is created inside TypeGPU, so reaching it needs a patch or a wrapper (not established: whether a public accessor exists).',
      'WebGPU Inspector is documented to list validation errors; not run by us.',
    ],
    classification: 'convenient',
    classificationLabel: 'more convenient, not unique',
    adds: [
      'One record ties the failure to the TypeGPU pipeline (label broken, trigger initAsync, phase create) and to the exact generated WGSL (78 characters).',
      'The compiler message arrives as structured data (shader-diagnostics, line 1, column 51) correlated by pipelineId, not as free text.',
      'The failure stays in snapshot.retainedFailures even after the history ring has moved on, and the stream ends with device-lost after teardown.',
      'Safari 26.3 gave no device-error for an invalid render pipeline in the validation runs; shader-diagnostics was then the only signal, so a normalised record has value there.',
    ],
    cannot: [
      'Which TypeScript statement produced the bad WGSL: positions refer to the generated code and there is no source map (upstream TypeGPU issue 2935 is working on that).',
      'Whether a given browser reports the error at all.',
    ],
    futureUi:
      'A failure card per pipeline: label, trigger, phase, the generated WGSL with the compiler position underlined, and the related device errors grouped under it.',
  },
  'resolve-error': {
    title: 'Resolution error',
    question: 'Why does nothing run, and why is there no browser error?',
    symptom: 'A slot has no value, so TypeGPU cannot generate the shader at the first dispatch.',
    without: [
      'dispatchWorkgroups() throws a ResolutionError whose message names the tree and the missing slot. The browser prints nothing at all, because it never received a shader (control run).',
      'If the exception is swallowed, for example inside a render loop or a framework error boundary, the symptom is silence.',
    ],
    native: [
      'Only the exception and its stack. WebGPU-level tools see nothing because no WebGPU call happens (inferred from how they work, not verified).',
    ],
    classification: 'available',
    classificationLabel: 'already available as the thrown error',
    adds: [
      'A pipeline-creation-failed event with trigger lazy and phase resolve, label needsSlot and wgsl null: the explicit statement that WebGPU was never involved.',
      'A structured record that survives a swallowed exception, and an event a test or CI check can assert on.',
      'It adds no information beyond the exception itself: the event message equals the thrown message. This is the weakest of the three scenarios for the layer.',
    ],
    cannot: [
      'Anything beyond the exception. The event has no call-site stack.',
      'The phase resolve also covers some other failures that happen before the creation call (immediate-size validation, vertex/target connection, createShaderModule), so it does not always mean "WGSL generation failed".',
    ],
    futureUi:
      'The same failure card without a WGSL pane and with a "never reached WebGPU" label; useful mainly when the exception was not seen.',
  },
  'per-frame-churn': {
    title: 'Per-frame churn',
    question: 'Why does my frame time creep up and memory grow?',
    symptom: 'A render-loop shape with two classic mistakes: a new pipeline every frame and a scratch buffer per frame that is never destroyed.',
    without: [
      'Nothing. No error, no warning (control run). The symptoms are rising frame time and memory.',
    ],
    native: [
      'webgpu-memory reports growing pipeline and buffer counts and bytes; WebGPU Inspector has a live object list and a "mid-frame pipeline creation" rule (both documented, not run by us).',
      'Whether TypeGPU labels such as perFrame and scratch appear in those tools is untested.',
    ],
    classification: 'convenient',
    classificationLabel: 'more convenient; the growth is detectable elsewhere',
    adds: [
      'The recorded snapshot groups live objects by TypeGPU label: 5 live pipelines named perFrame, 5 live resources named scratch, 6 buffers still alive at teardown, per-pipeline dispatch counts (steady 5, each perFrame 1).',
      'CPU time of TypeGPU\'s own WGSL generation per creation (resolveMs 0.13 to 0.56 ms in this run). Those facts need TypeGPU internals; an outside tool cannot see them.',
      'The "named repeatedly" notes come from the example reporter (consumers/textReport.ts), not from the core. The core emits facts; interpretation lives in the consumer.',
    ],
    cannot: [
      'Whether the retained buffers are a leak or intended: the note is a heuristic on names.',
      'Where in the code the per-frame creation happens: events carry no stack.',
      'GPU cost of the churn. createMs is about 0.00 ms for repeated identical WGSL in this run and why was not investigated, so "each creation costs CPU" is only partly supported (resolveMs is real).',
    ],
    futureUi:
      'A live table grouped by label with counts and ages, a teardown diff of what survived, and a warning when the same label keeps being created.',
  },
};
