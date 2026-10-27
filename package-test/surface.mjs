#!/usr/bin/env node
// Package-surface audit of the packed tarballs: sizes, sideEffects, exports, what the shipped .d.ts exposes.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { here, results, syncConsumer, tsc, tsLib } from './lib/paths.mjs';

const out = [];
const log = (s = '') => { out.push(s); console.log(s); };
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const dirs = { pristine: syncConsumer('pristine'), patched: syncConsumer('patched') };
const pk = (t) => join(dirs[t], 'node_modules/typegpu');

log('## tarball / unpacked sizes');
for (const t of ['pristine', 'patched']) {
  const tgz = join(here, 'tarballs', t, 'typegpu-0.12.8.tgz');
  const files = walk(pk(t)).filter((f) => !f.endsWith('package.json') && !f.endsWith('README.md'));
  const instr = files.filter((f) => f.includes('/core/instrumentation/'));
  const sum = (fs, ext) => fs.filter((f) => f.endsWith(ext) && (ext !== '.js' || !f.endsWith('.d.ts'))).reduce((a, f) => a + statSync(f).size, 0);
  const rest = files.filter((f) => !f.includes('/core/instrumentation/'));
  log(`${t.padEnd(9)} tgz=${statSync(tgz).size} files=${files.length} | .js outside instrumentation=${sum(rest, '.js')} .d.ts outside=${sum(rest, '.d.ts')} | instrumentation dir: .js=${sum(instr, '.js')} .d.ts=${sum(instr, '.d.ts')}`);
}
log('\ninstrumentation dir files:');
for (const f of walk(join(pk('patched'), 'core/instrumentation')).sort()) log(`  ${relative(pk('patched'), f)}  ${statSync(f).size}`);

log('\n## package.json (packed)');
const pj = JSON.parse(readFileSync(join(pk('patched'), 'package.json'), 'utf8'));
log(`sideEffects=${JSON.stringify(pj.sideEffects)} type=${pj.type} main=${pj.main} types=${pj.types} exports keys=${Object.keys(pj.exports).join(', ')}`);
log(`exports["./unstable-instrumentation"]=${JSON.stringify(pj.exports['./unstable-instrumentation'])}`);
log(`leftover dev-only mapping in packed exports ($built$ / ./src / ./dist): ${JSON.stringify(pj.exports).match(/\$built\$|\.\/src|\.\/dist/g)?.length ?? 0}`);
log(`files field: ${JSON.stringify(pj.files)} (none => everything staged is published)`);

log('\n## core JS never imports the instrumentation modules at runtime');
const jsFiles = walk(pk('patched')).filter((f) => f.endsWith('.js') && !f.includes('/core/instrumentation/'));
const importers = jsFiles.filter((f) => /from ["'][^"']*instrumentation\//.test(readFileSync(f, 'utf8')));
log(`non-instrumentation .js files importing .../instrumentation/*: ${importers.length}${importers.length ? '\n' + importers.map((f) => '  ' + relative(pk('patched'), f)).join('\n') : ''}`);
const dtsImporters = walk(pk('patched')).filter((f) => f.endsWith('.d.ts') && !f.includes('/core/instrumentation/') && /instrumentation\//.test(readFileSync(f, 'utf8')));
log(`non-instrumentation .d.ts files referencing instrumentation/types (type-only): ${dtsImporters.map((f) => relative(pk('patched'), f)).join(', ')}`);
const dtsOut = dtsImporters.flatMap((f) => readFileSync(f, 'utf8').split('\n').filter((l) => /instrumentation\//.test(l)).map((l) => `  ${relative(pk('patched'), f)}: ${l.trim()}`));
log(dtsOut.join('\n'));

log('\n## names exported by the entry .d.ts (checker) and which are hook-internal');
const ts = createRequire(import.meta.url)(tsLib());
const opts = { moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'], skipLibCheck: true, types: [], noEmit: true };
const program = ts.createProgram([join(dirs.patched, 'src/ok.ts')], opts);
const checker = program.getTypeChecker();
const entrySf = program.getSourceFiles().find((f) => f.fileName.endsWith('node_modules/typegpu/core/instrumentation/index.d.ts'));
const names = checker.getExportsOfModule(checker.getSymbolAtLocation(entrySf)).map((s) => s.name).sort();
log(`entry exports (${names.length}): ${names.join(', ')}`);
const internal = ['InstrumentationHolder', 'InstrumentationSink', 'PipelineCreationInfo', 'TgpuInstrumentationProvider', 'TgpuInstrumentationEventInit'];
log(`hook-contract names exported publicly: ${names.filter((n) => internal.includes(n)).join(', ')}`);
const mainSf = program.getSourceFiles().find((f) => f.fileName.endsWith('node_modules/typegpu/index.d.ts'));
const mainNames = checker.getExportsOfModule(checker.getSymbolAtLocation(mainSf)).map((s) => s.name);
log(`names from the instrumentation entry also exported by main 'typegpu': ${names.filter((n) => mainNames.includes(n)).join(', ') || 'none'}`);
log(`files of core/instrumentation loaded when only importing 'typegpu' (baseline.ts, patched): ${(() => { const p = ts.createProgram([join(dirs.patched, 'src/baseline.ts')], opts); return p.getSourceFiles().filter((f) => f.fileName.includes('/core/instrumentation/')).map((f) => relative(pk('patched'), f.fileName)).join(', '); })()}`);

log('\n## tsc --extendedDiagnostics for an upstream-only import (skipLibCheck)');
for (const t of ['pristine', 'patched']) {
  const r = spawnSync('node', [tsc(), '-p', '.tmp/tsconfig.baseline.json', '--skipLibCheck', '--extendedDiagnostics'], { cwd: dirs[t], encoding: 'utf8' });
  log(`${t}: ` + r.stdout.split('\n').filter((l) => /^(Files|Lines of Declaration|Types|Instantiations|Memory used)/.test(l)).map((l) => l.replace(/\s+/g, ' ')).join(' | '));
}

log('\n## is the $internal symbol (key of the hook holder) reachable from a public entry?');
for (const e of ['index.d.ts', 'internal.d.ts', 'indexNamedExports.d.ts', 'data/index.d.ts', 'std/index.d.ts', 'common/index.d.ts']) {
  const f = join(pk('patched'), e);
  log(`${e}: ${/\$internal/.test(readFileSync(f, 'utf8')) ? 'mentions $internal' : 'no $internal'}`);
}
writeFileSync(join(results, 'surface.txt'), out.join('\n') + '\n');
