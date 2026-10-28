#!/usr/bin/env node
// Verifies that what the page says corresponds to the implementation and the repository:
//  1. the event table lists exactly the event types of overlay/src/types.ts (read with the compiler API);
//  2. the options table lists exactly the properties of TgpuInstrumentationOptions, with the defaults of overlay/src/hub.ts;
//  3. every identifier the code samples use is exported by the entry point or is a member of the public types;
//  4. the recorded debugging output still shows what the page explains (a failed async creation, a diagnostic at 1:51);
//  5. every repository link and every navigation id resolves.
// The code samples themselves are regions of package-test/consumer/src/**, which `package-test/run.sh` (K1) type-checks
// against the packed package under bundler, node16 and nodenext resolution.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const read = (p) => readFileSync(join(repo, p), 'utf8');
const problems = [];
const ok = (cond, msg) => cond || problems.push(msg);

const { generated } = await import('../src/app/data/generated.ts');
const pageHtml = readFileSync(join(here, '../src/app/page/instrumentation-page.html'), 'utf8');
const navTs = readFileSync(join(here, '../src/app/nav.ts'), 'utf8');

// ---- types.ts through the compiler
const typesPath = join(repo, 'overlay/src/types.ts');
const program = ts.createProgram([typesPath], {
  noResolve: true,
  target: ts.ScriptTarget.ES2022,
  strict: true,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();
const source = program.getSourceFile(typesPath);
const eventTypes = new Set();
let optionProps = [];
ts.forEachChild(source, (node) => {
  if (!ts.isTypeAliasDeclaration(node) || !node.name.text.startsWith('Tgpu')) return;
  const type = checker.getTypeAtLocation(node.name);
  if (node.name.text === 'TgpuInstrumentationOptions')
    optionProps = checker.getPropertiesOfType(type).map((p) => p.name);
  const typeProp = type.getProperty('type');
  const typeType = typeProp && checker.getTypeOfSymbolAtLocation(typeProp, node);
  if (typeType?.isStringLiteral()) eventTypes.add(typeType.value);
});
ok(eventTypes.size >= 9, `found only ${eventTypes.size} event types in types.ts`);

// ---- 1. event table
const tableEvents = [...pageHtml.matchAll(/data-event="([a-z-]+)"/g)].map((m) => m[1]).sort();
ok(
  JSON.stringify(tableEvents) === JSON.stringify([...eventTypes].sort()),
  `event table (${tableEvents}) differs from types.ts (${[...eventTypes].sort()})`,
);

// ---- 2. options table and defaults
const tableOptions = [...pageHtml.matchAll(/data-option="([A-Za-z]+)"/g)].map((m) => m[1]).sort();
ok(
  JSON.stringify(tableOptions) === JSON.stringify([...optionProps].sort()),
  `options table (${tableOptions}) differs from TgpuInstrumentationOptions (${optionProps})`,
);
const hub = read('overlay/src/hub.ts');
const rowOf = (name) => pageHtml.match(new RegExp(`data-option="${name}".*`))?.[0] ?? '';
ok(
  /DEFAULT_HISTORY_SIZE = 256;/.test(hub) && rowOf('historySize').includes('<code>256</code>'),
  'historySize default on the page is not hub.ts DEFAULT_HISTORY_SIZE',
);
ok(
  /DEFAULT_HISTORY_MAX_BYTES = 4 \* 1024 \* 1024;/.test(hub) &&
    rowOf('historyMaxBytes').includes('4 MiB'),
  'historyMaxBytes default on the page is not hub.ts DEFAULT_HISTORY_MAX_BYTES',
);
ok(
  /captureSource: captureSource \?\? true/.test(hub) &&
    rowOf('captureSource').includes('<code>true</code>'),
  'captureSource default on the page is not true',
);

// ---- 3. identifiers in the code samples
const entry = read('overlay/src/index.ts');
ok(
  /export function createInstrumentation/.test(entry),
  'createInstrumentation is not exported by overlay/src/index.ts',
);
const samples = Object.entries(generated).filter(([, v]) => typeof v === 'object' && 'plain' in v);
const used = {
  quickstart: [
    'createInstrumentation',
    'unstable_instrumentation',
    "['~unstable'].instrumentation",
    'subscribe',
    'getSnapshot',
  ],
  cleanup: ['disable', 'enable', 'dispose', 'destroy'],
  consumers: ['attachConsoleReporter', 'createJsonlExport', 'parseJsonl'],
};
for (const [name, needles] of Object.entries(used))
  for (const n of needles)
    ok(generated[name].plain.includes(n), `the ${name} sample no longer shows ${n}`);
function interfaceMembers(name) {
  const body =
    read('overlay/src/types.ts').match(
      new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`),
    )?.[1] ?? '';
  return [...body.matchAll(/^\s{2}(?:readonly )?([a-zA-Z]+)[(:]/gm)].map((m) => m[1]);
}
const facade = interfaceMembers('TgpuInstrumentation');
for (const method of ['subscribe', 'history', 'getSnapshot', 'enable', 'disable', 'dispose'])
  ok(facade.includes(method), `TgpuInstrumentation has no ${method}`);
ok(samples.length >= 8, 'a code sample is missing from generated.ts');

// ---- 4. the recorded debugging output
ok(
  generated.debugOutput.plain.includes('creation FAILED [initAsync, create]'),
  'recorded output no longer shows the failed async creation',
);
ok(
  generated.debugOutput.plain.includes('shader: error at WGSL 1:51'),
  'recorded output no longer shows the diagnostic at WGSL 1:51',
);
const wgsl = generated.debugWgsl.plain;
ok(
  wgsl.split('\n')[0].indexOf('definitelyUndeclared') === 50,
  'WGSL column 51 is no longer definitelyUndeclared',
);

// ---- the event followed by the architecture diagram
const followed = generated.archEventFields;
ok(
  followed.type === 'pipeline-creation-failed' && followed.phase === 'create',
  'the diagram follows a pipeline-creation-failed (create) event',
);
ok(
  generated.archLine.plain.includes('creation FAILED [initAsync, create]'),
  'the diagram line is not the recorded console line',
);
for (const key of Object.keys(followed))
  ok(key in failureEvent(), `the followed event has no field "${key}"`);
function failureEvent() {
  return Object.fromEntries(
    read('real-gpu/results/scenarios/broken-shader.jsonl')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l))
      .filter((r) => r.record === 'event' && r.event.type === 'pipeline-creation-failed')
      .flatMap((r) => Object.entries(r.event)),
  );
}
ok(
  /pipelineCreationFailed\(/.test(read('overlay/src/types.ts')),
  'the sink contract has no pipelineCreationFailed',
);
ok(
  read('patches/0001-instrumentation-hooks.patch').includes(
    'instrumentation?.pipelineCreationFailed(',
  ),
  'the patch has no pipelineCreationFailed hook',
);

// ---- 5. links and anchors
for (const m of navTs.matchAll(/\{ id: '([a-z-]+)', label/g))
  ok(
    new RegExp(`<section id="${m[1]}"`).test(pageHtml),
    `nav id "${m[1]}" has no section on the page`,
  );
for (const m of pageHtml.matchAll(/repo(?:File|Dir)\('([^']+)'\)/g))
  ok(existsSync(join(repo, m[1])), `page links to a missing path: ${m[1]}`);
for (const f of [
  'real-gpu/run.mjs',
  'examples/broken-shader.ts',
  'scripts/setup.sh',
  'scripts/setup-pristine.sh',
  'package-test/stage.mjs',
])
  ok(pageHtml.includes(f) || JSON.stringify(generated).includes(f), `page no longer mentions ${f}`);
for (const f of [
  'real-gpu/run.mjs',
  'examples/broken-shader.ts',
  'scripts/setup.sh',
  'scripts/setup-pristine.sh',
  'package-test/stage.mjs',
])
  ok(existsSync(join(repo, f)), `the page mentions a missing file: ${f}`);

if (problems.length) {
  console.error(`check-site: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `check-site: ok (${eventTypes.size} event types, ${optionProps.length} options, ${samples.length} code samples)`,
);
