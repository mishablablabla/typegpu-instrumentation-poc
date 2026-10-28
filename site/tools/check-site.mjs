#!/usr/bin/env node
// Verifies that what the page shows corresponds to the implementation and the repository:
//  1. every event fixture on the page is a real event of the documented schema: its type is in the contract, every
//     field is a property of the TypeScript type in overlay/src/types.ts, every required property is present;
//  2. the events of the recorded scenarios obey the same rule and `seq` is contiguous;
//  3. the quick start on the page is the region of the type-checked consumer file (not retyped);
//  4. every repository file the page links to exists; every nav id has a section on the page;
//  5. the documented event list equals the schema's type union.
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

// ---- property sets of every event type, from the compiler
const typesPath = join(repo, 'overlay/src/types.ts');
const program = ts.createProgram([typesPath], { noResolve: true, target: ts.ScriptTarget.ES2022, strict: true, skipLibCheck: true });
const checker = program.getTypeChecker();
const source = program.getSourceFile(typesPath);
const byType = new Map();
ts.forEachChild(source, (node) => {
  if (!ts.isTypeAliasDeclaration(node) || !node.name.text.startsWith('Tgpu')) return;
  const type = checker.getTypeAtLocation(node.name);
  const typeProp = type.getProperty('type');
  if (!typeProp) return;
  const typeType = checker.getTypeOfSymbolAtLocation(typeProp, node);
  if (!typeType.isStringLiteral()) return;
  const props = checker.getPropertiesOfType(type);
  const resourceProp = type.getProperty('resource');
  const resourceType = resourceProp ? checker.getTypeOfSymbolAtLocation(resourceProp, node) : undefined;
  // buffer and texture materialisation share one event type and differ by `resource`
  const key = resourceType?.isStringLiteral() ? `${typeType.value}:${resourceType.value}` : typeType.value;
  byType.set(key, {
    all: new Set(props.map((p) => p.name)),
    required: props.filter((p) => !(p.flags & ts.SymbolFlags.Optional)).map((p) => p.name),
  });
});
ok(byType.size >= 9, `found only ${byType.size} event types in types.ts`);

// ---- 5. contract list == schema union (resource-materialized is one documented row, two TypeScript members)
const schemaTypes = [...new Set([...byType.keys()].map((k) => k.split(':')[0]))].sort();
const documented = [...generated.documentedTypes].sort();
ok(JSON.stringify(schemaTypes) === JSON.stringify(documented), `schema types ${schemaTypes} differ from the documented ${documented}`);

function checkEvent(event, where) {
  ok(event.v === 2, `${where}: v is ${event.v}`);
  const spec = byType.get(event.resource ? `${event.type}:${event.resource}` : event.type);
  if (!spec) return problems.push(`${where}: unknown event type ${event.type}`);
  for (const key of Object.keys(event)) ok(spec.all.has(key), `${where}: field "${key}" is not in the ${event.type} type`);
  for (const key of spec.required) ok(key in event, `${where}: required field "${key}" missing`);
}

// ---- 1. fixtures on the page
for (const ex of generated.eventExamples) {
  const event = JSON.parse(readFileSync(join(repo, ex.fromFile), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((l) => l.record === 'event').map((l) => JSON.stringify(l.event)).find((j) => JSON.parse(j).seq === ex.seq && JSON.parse(j).type === ex.type) ?? 'null');
  ok(event !== null, `fixture ${ex.name}: not found in ${ex.fromFile}`);
  if (event) checkEvent(event, `fixture ${ex.name}`);
}

// ---- 2. recorded scenarios
for (const [id, sc] of Object.entries(generated.scenarios)) {
  sc.events.forEach((e, i) => {
    const event = JSON.parse(e.json);
    checkEvent(event, `${id} seq ${e.seq}`);
    ok(event.seq === i + 1, `${id}: seq not contiguous at index ${i} (got ${event.seq})`);
  });
}

// ---- 3. quick start is the verified region
const qs = read('package-test/consumer/src/quickstart.ts').match(/\/\/ #region quickstart\n([\s\S]*?)\/\/ #endregion quickstart/)?.[1].trimEnd();
ok(qs === generated.quickstartPlain, 'quick start on the page differs from package-test/consumer/src/quickstart.ts');
for (const name of ['createInstrumentation', 'unstable_instrumentation', "['~unstable'].instrumentation", 'subscribe', 'getSnapshot', 'dispose']) {
  ok(generated.quickstartPlain.includes(name), `quick start does not show ${name}`);
}
const exportsSrc = read('overlay/src/index.ts');
ok(/export function createInstrumentation/.test(exportsSrc), 'createInstrumentation is not exported by overlay/src/index.ts');

// ---- 4. links and anchors
const pageTs = readFileSync(join(here, '../src/app/data/facts.ts'), 'utf8');
for (const m of pageTs.matchAll(/(?:source|path): '([^']+)'/g)) ok(existsSync(join(repo, m[1])), `facts.ts references a missing file: ${m[1]}`);
const navTs = readFileSync(join(here, '../src/app/nav.ts'), 'utf8');
for (const m of navTs.matchAll(/path: '([^']+)'/g)) ok(existsSync(join(repo, m[1])), `nav.ts references a missing file: ${m[1]}`);
const html = readFileSync(join(here, '../src/app/page/instrumentation-page.html'), 'utf8');
for (const m of navTs.matchAll(/\{ id: '([a-z-]+)', label/g)) ok(new RegExp(`<section id="${m[1]}"`).test(html), `nav id "${m[1]}" has no section on the page`);
for (const m of html.matchAll(/repoFile\('([^']+)'\)/g)) ok(existsSync(join(repo, m[1])), `page links to a missing file: ${m[1]}`);
for (const f of ['docs/EVENT-CONTRACT.md', 'docs/ARCHITECTURE-DECISION.md', 'docs/PERFORMANCE.md', 'docs/ECOSYSTEM-RESEARCH.md', 'docs/PRODUCTION-READINESS.md', 'README.md']) ok(existsSync(join(repo, f)), `missing ${f}`);

// ---- numbers on the page that must agree with the reports they cite
const mustAppear = JSON.parse(readFileSync(join(here, 'facts-check.json'), 'utf8'));
for (const [file, needles] of Object.entries(mustAppear)) {
  const text = read(file);
  for (const n of needles) ok(text.includes(n), `${file} no longer contains "${n}" (the page quotes it)`);
}

if (problems.length) {
  console.error(`check-site: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`check-site: ok (${generated.eventExamples.length} fixtures, ${Object.values(generated.scenarios).reduce((n, s) => n + s.events.length, 0)} recorded events checked against ${byType.size} schema types)`);
