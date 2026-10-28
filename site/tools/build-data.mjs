#!/usr/bin/env node
// Generates src/app/data/generated.ts from the repository's own artifacts, so that nothing on the page is
// retyped by hand: recorded scenario output (real-gpu/results/scenarios), scenario sources (examples/), the
// type-checked quick start (package-test/consumer/src/quickstart.ts) and the contract's event list.
// Syntax highlighting happens here (shiki, devDependency); the app ships no highlighter.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHighlighter } from 'shiki';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const read = (p) => readFileSync(join(repo, p), 'utf8');

const highlighter = await createHighlighter({
  themes: ['night-owl-light', 'night-owl'],
  langs: ['ts', 'json', 'wgsl', 'bash', 'text'],
});
const html = (code, lang) =>
  highlighter.codeToHtml(code, {
    lang,
    themes: { light: 'night-owl-light', dark: 'night-owl' },
    defaultColor: false,
  });

// ---- quick start: the region between the markers of the type-checked consumer file
const qsSource = read('package-test/consumer/src/quickstart.ts');
const region = qsSource.match(/\/\/ #region quickstart\n([\s\S]*?)\/\/ #endregion quickstart/);
if (!region) throw new Error('quickstart region markers not found');
const quickstart = region[1].trimEnd();

// ---- scenarios
const scenarioIds = ['broken-shader', 'resolve-error', 'per-frame-churn'];
const scenarios = {};
for (const id of scenarioIds) {
  const base = `real-gpu/results/scenarios/${id}`;
  const lines = read(`${base}.jsonl`).trim().split('\n').map((l) => JSON.parse(l));
  const env = lines.find((l) => l.record === 'environment');
  const events = lines.filter((l) => l.record === 'event').map((l) => l.event);
  const snapshot = lines.find((l) => l.record === 'snapshot')?.snapshot ?? null;
  const txt = read(`${base}.txt`);
  // the printed trace = everything between the blank line after the header block and the JSONL footer
  const body = txt.split('\n\n')[1] ?? '';
  const trace = body.split('\n').filter((l) => !l.startsWith('JSONL written'));
  const source = read(`examples/${id}.ts`).trimEnd();
  const controlJson = JSON.parse(read(`real-gpu/results/control/${id}.json`));
  scenarios[id] = {
    id,
    control: {
      file: `real-gpu/results/control/${id}.json`,
      browser: controlJson.environment.chrome,
      lines: controlJson.browserConsole.map((e) => ({ source: e.source, level: e.level, text: e.text })),
      threw: controlJson.error,
    },
    recordedAt: env.when,
    environment: {
      browser: env.chrome,
      headless: env.headless,
      classification: env.classification,
      adapter: `${env.adapter.vendor} / ${env.adapter.architecture}`,
      isFallbackAdapter: env.adapter.isFallbackAdapter,
      gpuProcess: env.gpuProcess,
    },
    sourceHtml: html(source, 'ts'),
    sourceFile: `examples/${id}.ts`,
    traceFile: `${base}.txt`,
    jsonlFile: `${base}.jsonl`,
    trace,
    events: events.map((e) => ({ seq: e.seq, type: e.type, json: JSON.stringify(e, null, 2) })),
    eventTypes: events.map((e) => e.type),
    eventCount: events.length,
    snapshotCounters: snapshot?.counters ?? null,
  };
}

// ---- representative events, verbatim from the recorded JSONL (found by predicate, never retyped)
const allEvents = (id) =>
  read(`real-gpu/results/scenarios/${id}.jsonl`)
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l))
    .filter((l) => l.record === 'event')
    .map((l) => l.event);
const pick = (id, predicate, why) => {
  const e = allEvents(id).find(predicate);
  if (!e) throw new Error(`no event for: ${why}`);
  return { event: e, fromFile: `real-gpu/results/scenarios/${id}.jsonl`, json: JSON.stringify(e, null, 2) };
};
const examples = {
  'pipeline-created': pick('per-frame-churn', (e) => e.type === 'pipeline-created', 'pipeline-created'),
  'pipeline-creation-failed (resolve)': pick('resolve-error', (e) => e.type === 'pipeline-creation-failed' && e.phase === 'resolve', 'resolve failure'),
  'pipeline-creation-failed (create)': pick('broken-shader', (e) => e.type === 'pipeline-creation-failed' && e.phase === 'create', 'create failure'),
  'shader-diagnostics': pick('broken-shader', (e) => e.type === 'shader-diagnostics', 'shader-diagnostics'),
  'device-error': pick('broken-shader', (e) => e.type === 'device-error', 'device-error'),
  'device-lost': pick('broken-shader', (e) => e.type === 'device-lost', 'device-lost'),
};
const eventExamples = Object.entries(examples).map(([name, v]) => ({
  name,
  fromFile: v.fromFile,
  type: v.event.type,
  seq: v.event.seq,
  html: html(v.json, 'json'),
}));

// ---- the documented event types, parsed from the contract table (a drift between page and contract fails the build)
const contract = read('docs/EVENT-CONTRACT.md');
const documentedTypes = [...contract.matchAll(/^\| `([a-z-]+)` \| /gm)].map((m) => m[1]);

// ---- setup commands: the two lines the README documents for a fresh clone
const setupPlain = [
  '# in a clone of this repository (pnpm 11, Node >= 24):',
  'scripts/setup.sh     # upstream TypeGPU at the pinned commit, hook patch applied, overlay copied in',
  'scripts/check.sh     # mock-device tests, type check, lint (no GPU, no browser)',
].join('\n');

const out = {
  setupHtml: html(setupPlain, 'bash'),
  setupPlain,
  generatedFrom: [
    'real-gpu/results/scenarios/*.jsonl|txt',
    'examples/*.ts',
    'package-test/consumer/src/quickstart.ts',
    'docs/EVENT-CONTRACT.md',
  ],
  quickstartHtml: html(quickstart, 'ts'),
  quickstartPlain: quickstart,
  scenarios,
  eventExamples,
  documentedTypes,
  highlightedBash: (code) => undefined,
};
delete out.highlightedBash;

// ---- the live feed reuses the repository's own consumers and the broken-shader scenario unchanged (only the type
// import path differs, because the consumers are written against the patched work tree)
const liveDir = join(here, '../src/app/live/generated');
mkdirSync(liveDir, { recursive: true });
const banner = (from) => `// GENERATED by tools/build-data.mjs from ${from}. Do not edit.\n/* eslint-disable */\n// @ts-nocheck\n`;
for (const f of ['textReport.ts', 'jsonlExport.ts']) {
  const src = read(`consumers/${f}`).replaceAll("'../../../src/core/instrumentation/types.ts'", "'typegpu/unstable-instrumentation'");
  writeFileSync(join(liveDir, f), banner(`consumers/${f}`) + src);
}
writeFileSync(join(liveDir, 'broken-shader.ts'), banner('examples/broken-shader.ts') + read('examples/broken-shader.ts'));

const ts = `// GENERATED by tools/build-data.mjs from repository artifacts. Do not edit.\n/* eslint-disable */\nexport const generated = ${JSON.stringify(out, null, 2)} as const;\n`;
writeFileSync(join(here, '../src/app/data/generated.ts'), ts);
console.log(`generated.ts: ${scenarioIds.length} scenarios, ${eventExamples.length} event examples, ${documentedTypes.length} documented types`);
