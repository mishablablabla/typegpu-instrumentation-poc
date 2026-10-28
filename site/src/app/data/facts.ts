import type { Status } from '../ui/status-badge';
import { repoFile } from '../nav';

/**
 * Every number and verdict on the page, with the file that backs it. Kept in one place so that tools/check-facts.mjs
 * can verify them against the reports and raw artifacts; the page does not retype them.
 */
export interface Fact {
  readonly label: string;
  readonly value: string;
  readonly note?: string;
  readonly source: string; // repository path
}

export const STATUS_FACTS: readonly Fact[] = [
  {
    label: 'API status',
    value: 'Experimental, unstable',
    note: 'Entry point, option names and event schema may change (schema v2).',
    source: 'docs/EVENT-CONTRACT.md',
  },
  {
    label: 'Opt-in',
    value: 'Explicit import and option',
    note: 'Nothing is observed unless createInstrumentation() is passed to tgpu.init.',
    source: 'README.md',
  },
  {
    label: 'Validation',
    value: '222 instrumentation tests; 133 / 133 real-device checks',
    note: 'Mock-device tests plus a real-GPU suite; mutation score 93.6 % to 95.5 % (see report).',
    source: 'docs/PRODUCTION-READINESS.md',
  },
  {
    label: 'Coverage',
    value: 'One Mac on hardware; software adapters elsewhere',
    note: 'Hardware: Apple M3 Pro, Chrome 156 and Safari 26.3. CI runners (no GPU): Chrome and Edge on Linux, Windows and macOS, Firefox on Linux, all 128 or 130 of 130. Firefox on Windows and macOS and Safari on a runner got no adapter.',
    source: 'docs/PRODUCTION-READINESS.md',
  },
];

export interface Verdict {
  readonly scope: string;
  readonly verdict: string;
  readonly tone: 'ok' | 'warn' | 'no';
  readonly why: string;
}

export const VERDICTS: readonly Verdict[] = [
  {
    scope: 'Experimental opt-in developer tooling',
    verdict: 'Conditionally ready',
    tone: 'ok',
    why: 'Correct on the validated scope, bounded memory, failure-isolated. Conditions: the listed deviations and blind spots, one machine, a core patch that is not upstream.',
  },
  {
    scope: 'Supported TypeGPU feature',
    verdict: 'Not ready',
    tone: 'no',
    why: 'Needs a maintainers\' decision on the core hooks, demand evidence that does not exist yet, platform breadth, and an answer to the overlap with upstream source-map work.',
  },
  {
    scope: 'Always-on production instrumentation',
    verdict: 'Not suitable',
    tone: 'no',
    why: 'About 0.4 to 0.6 µs per tracked object plus 0.2 to 0.4 µs per event while on; a budget of 1 % of the emitting operation is missed. Designed as a development tool.',
  },
  {
    scope: 'Cross-platform compatibility',
    verdict: 'Partially established',
    tone: 'warn',
    why: 'Passes on software or virtualised adapters on Linux, Windows and macOS runners (Chrome, Edge, Firefox on Linux). No physical GPU outside one Mac; Firefox on Windows and macOS, Safari on a runner, Node and React Native not run or not tested.',
  },
];

export interface PerfRow {
  readonly what: string;
  readonly value: string;
  readonly kind: 'measured' | 'derived' | 'missed';
  readonly detail: string;
}

export const PERF_ROWS: readonly PerfRow[] = [
  {
    what: 'Hub bytes for apps that do not import the entry',
    value: '0 bytes',
    kind: 'measured',
    detail: 'Absent in Vite 8.0.5, esbuild 0.27.5, webpack 5.104.1, rollup 4.60.1; importing it without using it adds +0 gzip.',
  },
  {
    what: 'Residual cost of the core hooks, for everyone',
    value: '+0.7 to +0.83 KB gzip',
    kind: 'missed',
    detail: 'The provisional target was 0.5 KB; missed and reported. Opting in is not required for this cost: the hooks ship in the core.',
  },
  {
    what: 'Cost of the entry, for users who opt in',
    value: '+3.7 to +4.2 KB gzip',
    kind: 'measured',
    detail: 'B minus A in the four bundlers; webpack\'s alternative estimate is +5.2 KB.',
  },
  {
    what: 'One counted dispatch (hook on)',
    value: '+5.0 to +5.5 ns',
    kind: 'measured',
    detail: 'Open pass, enabled vs disabled on the same bundle: +5.5 [5.3, 5.8] over 24 blocks; +5.0 [4.7, 5.3] re-measured on the final hub.',
  },
  {
    what: 'One buffer write (hook on)',
    value: '≈ +8 ns',
    kind: 'measured',
    detail: '+8.2 [3.5, 11.2] and +7.7 [6.1, 10.4] with controls; one earlier run without a control gave +13.5 [9.3, 16.6] and was not reproduced.',
  },
  {
    what: 'Whole own-encoder dispatch (2.4 µs)',
    value: '≈ 0.2 % to 1.2 %',
    kind: 'derived',
    detail: 'Derived from hooks per call times ns per hook. Not directly measurable: the measurement resolves only about ±1.4 %.',
  },
  {
    what: 'Per object and per event (hook on)',
    value: '≈ 0.4 to 0.6 µs + 0.2 to 0.4 µs',
    kind: 'missed',
    detail: 'Buffer create+destroy +852 ns, bind group +1 131 ns, sync pipeline about +2.6 to 3.4 µs. Budget "1 % of the operation" missed.',
  },
  {
    what: 'Disabled path (option not passed)',
    value: 'under 1 ns faster … +6.3 ns',
    kind: 'measured',
    detail: 'Versus unpatched TypeGPU: the open-pass dispatch is about 1 ns faster; for buffer.write the upper bound is +3.8 ns (24 blocks) and +6.3 ns (12 blocks), so the 3 ns target is not demonstrated. No claim of zero.',
  },
  {
    what: 'Sustained 60 s, 2 runs per setting',
    value: 'History bounded; no heap trend',
    kind: 'measured',
    detail: '4.6 M events per run, history stays 256 events / 88 KB. Two runs cannot support a finer trend claim. JS heap only.',
  },
];

export interface Integration {
  readonly name: string;
  readonly status: Status;
  readonly consumes: string;
  readonly needs: string;
  readonly limits: string;
}

export const INTEGRATIONS: readonly Integration[] = [
  {
    name: 'Plain TypeScript',
    status: 'verified',
    consumes: 'subscribe(), history(), getSnapshot()',
    needs: 'Nothing beyond the entry point.',
    limits: 'Requires the patched TypeGPU. API is unstable.',
  },
  {
    name: 'Console reporter',
    status: 'verified',
    consumes: 'every event, one text line each',
    needs: 'consumers/consoleReporter.ts (an example, not exported by the package).',
    limits: 'Formatting only; the cost of real console I/O was not measured.',
  },
  {
    name: 'JSONL export and reader',
    status: 'verified',
    consumes: 'every event plus a snapshot record',
    needs: 'consumers/jsonlExport.ts and jsonlRead.ts (rejects unknown versions).',
    limits: 'File or network sinks are the consumer\'s job.',
  },
  {
    name: 'Angular: recorded trace explorer',
    status: 'prototype',
    consumes: 'recorded JSONL files',
    needs: 'This page.',
    limits: 'Reads recorded data; it is not connected to a live runtime.',
  },
  {
    name: 'Angular: live event feed',
    status: 'prototype',
    consumes: 'subscribe() on a root created in the page',
    needs: 'The patched TypeGPU in the page bundle; WebGPU in the viewer\'s browser.',
    limits: 'Small scenarios only; not a dashboard for an arbitrary app.',
  },
  {
    name: 'React',
    status: 'proposed',
    consumes: 'subscribe() and getSnapshot() through a hook',
    needs: 'A useSyncExternalStore-style adapter (small); nothing exists.',
    limits: 'Same constraints as plain TypeScript.',
  },
  {
    name: 'React Native',
    status: 'proposed',
    consumes: 'the same events',
    needs: 'A WebGPU runtime (react-native-webgpu) that implements uncapturederror, lost and getCompilationInfo.',
    limits: 'Not tested: whether those APIs exist there is not established. Browser extensions and CDP tools do not apply.',
  },
  {
    name: 'Browser extension',
    status: 'proposed',
    consumes: 'events through a page-to-extension bridge',
    needs: 'Activation without editing the app (a global hook, not built) and a transport.',
    limits: 'Would sit beside WebGPU Inspector, which is far richer for raw WebGPU.',
  },
  {
    name: 'MCP server',
    status: 'proposed',
    consumes: 'events or JSONL over a transport',
    needs: 'A server and a way to reach a live app. No code exists.',
    limits: 'The existing Runtime Inspector MCP is an offline validator; whether it would consume this stream is unproven.',
  },
];

export interface EventMeaning {
  readonly type: string;
  readonly means: string;
  readonly notProof: string;
}

export const EVENT_MEANINGS: readonly EventMeaning[] = [
  {
    type: 'pipeline-created',
    means: 'TypeGPU generated WGSL, asked WebGPU for a pipeline, and the call returned.',
    notProof: 'With validation: "deferred" it does not say the shader is valid. Failures arrive later as shader-diagnostics and device-error.',
  },
  {
    type: 'pipeline-creation-failed',
    means: 'No pipeline was produced. phase "resolve" is synchronous, phase "create" is an async rejection.',
    notProof: 'A synchronous WebGPU validation failure does not produce it. phase "resolve" also covers other errors before the creation call.',
  },
  {
    type: 'shader-diagnostics',
    means: 'getCompilationInfo() of the shader module resolved; positions refer to the generated WGSL.',
    notProof: 'Not a mapping to your TypeScript source. May arrive after unrelated later events.',
  },
  {
    type: 'device-error',
    means: 'The browser fired uncapturederror on the device.',
    notProof: 'Not attributed to a pipeline or resource, and not deduplicated: Chrome may report one failure twice, Safari sometimes not at all.',
  },
  {
    type: 'device-lost',
    means: 'The device\'s lost promise resolved (once per device).',
    notProof: 'Only the owned-device destroyed reason was captured on hardware. A real GPU reset was never observed. A loss while the layer is disabled is announced once by the next enable().',
  },
];

export const LIMITATIONS: readonly { title: string; body: string }[] = [
  {
    title: 'Helpers and wrappers are not observed',
    body: 'Helper submissions (buffer.read, clear, copyFrom, texture utilities, query sets), wrapped GPU objects, restored pipelines, samplers, texture views, bind-group layouts and render bundles are listed in snapshot.unavailable and pinned by tests.',
  },
  {
    title: 'Raw WebGPU calls bypass the layer',
    body: 'Only calls that go through instrumented TypeGPU paths are seen. A device-level tap (experiments/device-tap) would cover raw calls at about +4 µs per encoder, but cannot see TypeGPU semantics; it is a possible complement.',
  },
  {
    title: 'No call-site stack and no GPU time',
    body: 'Events do not say where in your code a call happened, and carry CPU time only. Positions in compiler messages refer to generated WGSL.',
  },
  {
    title: 'Retry loops flood the history',
    body: 'A broken pipeline unwrapped every frame emits one failure per frame and fills the 256-event ring in about four seconds at 60 fps. retainedFailures keeps the latest 16. Open, documented.',
  },
  {
    title: 'disable() is a blind spot, not a pause',
    body: 'Objects created while disabled stay untracked. (A device loss during that time is announced once by the next enable().)',
  },
  {
    title: 'Memory is bounded by an estimate',
    body: 'History is bounded by an estimate of payload bytes, not by the heap. Pinned failures have their own budget and live pipelines keep their WGSL, so retained memory can reach about twice the history bound.',
  },
  {
    title: 'The core patch is not upstream',
    body: 'Twelve files, 19 call sites. The drift job proves only that the patch still applies and the instrumentation tests still pass on upstream main. It does not prove that hook placement is still semantically right.',
  },
  {
    title: 'Breadth',
    body: 'Hardware: one Mac, Chrome and Safari. Other operating systems are covered by CI on software adapters only, with no physical GPU. Timing was measured in Chrome on one machine only.',
  },
  {
    title: 'Proposed integrations are not validated',
    body: 'React, React Native, the browser extension and MCP are proposals. None is implemented.',
  },
];

export interface RoadmapStep {
  readonly phase: string;
  readonly title: string;
  readonly items: readonly string[];
}

export const ROADMAP: readonly RoadmapStep[] = [
  {
    phase: 'Immediate',
    title: 'Stabilise and find out whether anyone wants it',
    items: [
      'Show the three scenarios to TypeGPU users and maintainers and ask which they have hit.',
      'Run WebGPU Inspector on the same scenarios to confirm or refute the differentiation.',
      'Ask the Runtime Inspector MCP maintainer whether a supported stream would replace private-symbol reads.',
    ],
  },
  {
    phase: 'Near-term',
    title: 'Decide how the hooks are maintained and widen compatibility',
    items: [
      'Maintainers decide: keep the hooks in core, shrink them, or move payload building into the hub (estimated −100 to −150 B gzip).',
      'Run the real-GPU suite on physical Windows and Linux GPUs, a discrete GPU and Firefox or Safari with an adapter (a GPU runner); the harness records the environment.',
      'Decide the retry-flood behaviour.',
    ],
  },
  {
    phase: 'Medium-term',
    title: 'A small framework-independent consumer API, where justified',
    items: [
      'A test helper that asserts "no failures, nothing alive at teardown" from the stream.',
      'A global-hook activation so tools can enable the layer without editing the app.',
      'An optional consumer that maps compiler positions back to TypeScript statements, built with the Runtime Inspector MCP\'s author on top of its statement-map idea (not yet attempted; check against upstream source-map work first).',
    ],
  },
  {
    phase: 'Long-term',
    title: 'Richer interfaces, only on demonstrated need',
    items: [
      'A panel, a browser extension or an MCP transport, built as consumers of the same contract.',
      'No timeline is promised: it depends on the answers above.',
    ],
  },
];

export const REFERENCES: readonly { label: string; path: string; what: string }[] = [
  { label: 'Event contract', path: 'docs/EVENT-CONTRACT.md', what: 'The authoritative definition: events, ordering guarantees, deviations found by audit.' },
  { label: 'Architecture and lifecycle', path: 'docs/ARCHITECTURE-DECISION.md', what: 'Layers, lifecycle, alternatives that were evaluated and why.' },
  { label: 'Performance', path: 'docs/PERFORMANCE.md', what: 'Method, raw data names, corrections to earlier reports.' },
  { label: 'Ecosystem research', path: 'docs/ECOSYSTEM-RESEARCH.md', what: 'Existing tools, comparison matrix, recommendation, sources.' },
  { label: 'Production readiness', path: 'docs/PRODUCTION-READINESS.md', what: 'Verdicts, acceptance matrix, defects found, limits.' },
  { label: 'README', path: 'README.md', what: 'Use it, reproduce the evidence, repository layout.' },
];

export const fileUrl = repoFile;
