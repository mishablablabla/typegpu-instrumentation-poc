#!/usr/bin/env node
// K1 consumption checks against the PACKED + INSTALLED typegpu (package-test/work/patched/node_modules/typegpu).
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { here, results, syncConsumer, tsc, tsLib } from './lib/paths.mjs';

mkdirSync(results, { recursive: true });
const dir = syncConsumer('patched');
const save = (name, text) => writeFileSync(join(results, name), text);
const sh = (cmd, args, cwd = dir) => spawnSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const summary = [];
const record = (id, ok, detail) => { summary.push({ id, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${detail ?? ''}`); };

// ---- (a) tsc against the shipped .d.ts ----
let raw = '';
for (const mode of ['bundler', 'node16', 'nodenext', 'node10']) {
  const r = sh('node', [tsc(), '-p', `tsconfig.${mode}.json`]);
  const out = r.stdout + r.stderr;
  raw += `\n$ tsc -p tsconfig.${mode}.json (skipLibCheck:false)  -> exit ${r.status}\n${out}`;
  const strictLibLines = out.split('\n').filter((l) => l.startsWith('node_modules/'));
  const sc = sh('node', [tsc(), '-p', `tsconfig.${mode}.json`, '--skipLibCheck']);
  raw += `\n$ tsc -p tsconfig.${mode}.json --skipLibCheck -> exit ${sc.status}\n${sc.stdout}${sc.stderr}`;
  const touchesInstr = strictLibLines.some((l) => l.includes('instrumentation'));
  if (mode === 'node10') {
    // legacy resolution ignores `exports`: expected to fail for every subpath (same for typegpu/data etc.)
    record(`K1a ok.ts moduleResolution=${mode}`, r.status !== 0, `exit ${r.status} (expected failure: node10 ignores package exports)\n    ${out.split('\n')[0]}`);
  } else {
    record(`K1a ok.ts moduleResolution=${mode} (skipLibCheck:true)`, sc.status === 0, `exit ${sc.status}${sc.stdout ? '\n' + sc.stdout.slice(0, 400) : ''}`);
    record(`K1a ok.ts moduleResolution=${mode} (skipLibCheck:false): no diagnostic in instrumentation .d.ts`, !touchesInstr, `exit ${r.status}; ${strictLibLines.length} lib diagnostics, all upstream (see baseline rows)`);
  }
}
// Attribution: the same strict check on upstream-only code, pristine vs patched tarball.
for (const tree of ['pristine', 'patched']) {
  const tdir = syncConsumer(tree);
  mkdirSync(join(tdir, '.tmp'), { recursive: true });
  writeFileSync(join(tdir, '.tmp/tsconfig.baseline.json'), JSON.stringify({ extends: '../tsconfig.bundler.json', include: ['../src/baseline.ts'] }));
  const r = spawnSync('node', [tsc(), '-p', '.tmp/tsconfig.baseline.json'], { cwd: tdir, encoding: 'utf8' });
  const out = (r.stdout + r.stderr).trim();
  raw += `\n$ [${tree}] tsc -p .tmp/tsconfig.baseline.json (skipLibCheck:false, upstream-only import)  -> exit ${r.status}\n${out}\n`;
  const codes = [...out.matchAll(/error (TS\d+)/g)].map((m) => m[1]).join(',');
  record(`K1a baseline (upstream-only code) strict lib check [${tree}]`, true, `exit ${r.status} ${codes ? '(pre-existing diagnostics: ' + codes + ')' : '(clean)'}`);
}
save('k1a-ok.txt', raw);

const bad = {
  'true.ts': 'TS2322', 'forgot-call.ts': 'TS2322', 'option-name.ts': 'TS2353', 'option-type.ts': 'TS2322',
  'event-field.ts': 'TS2339', 'event-type.ts': 'TS2367', 'no-optional-chain.ts': 'TS2532',
  'hub-not-exported.ts': 'TS2724', 'not-from-main.ts': 'TS2614', 'deep-import.ts': 'TS2307', 'sink-method.ts': 'TS2339',
};
raw = '';
mkdirSync(join(dir, '.tmp'), { recursive: true });
for (const mode of ['bundler', 'node16']) {
  for (const [file, code] of Object.entries(bad)) {
    const cfg = `.tmp/tsconfig.${mode}.${file}.json`;
    writeFileSync(join(dir, cfg), JSON.stringify({ extends: `../tsconfig.${mode}.json`, include: [`../src/bad/${file}`] }));
    const r = sh('node', [tsc(), '-p', cfg, '--skipLibCheck']); // only the consumer file's own diagnostics matter here
    const out = (r.stdout + r.stderr).trim();
    raw += `\n$ tsc -p ${cfg}  -> exit ${r.status}\n${out}\n`;
    const own = out.split('\n').filter((l) => l.startsWith(`src/bad/${file}`));
    const first = own[0] ?? '(no error in the file!)';
    record(`K1a bad/${file} [${mode}]`, r.status !== 0 && own.some((l) => l.includes(code)), `expect ${code}: ${first.replace(/^.*error /, '')}`);
  }
}
save('k1a-bad.txt', raw);

// ---- (b) import-time side effects ----
{
  const r = sh('node', ['src/importEffects.mjs']);
  save('k1b-import-effects.txt', r.stdout + r.stderr);
  let j; try { j = JSON.parse(r.stdout); } catch { j = null; }
  const d = j?.importEntryAfterTypegpu;
  const clean = d && d.newGlobals.length === 0 && !d.processEventsChanged && d.activeResourcesDelta === 0 && !d.prototypesChanged && !d.errorHooksChanged;
  record('K1b node ESM import of the entry: no globals/listeners/handles/prototype changes', !!clean, `constructed at import (control subtracted by reader): entry=${JSON.stringify(d?.constructed)} control=${JSON.stringify(j?.controlImportNodeOs?.constructed)}`);
}

// ---- (c) exports resolution ----
{
  const ts = createRequire(import.meta.url)(tsLib());
  const lines = [];
  const specs = ['typegpu', 'typegpu/unstable-instrumentation', 'typegpu/data', 'typegpu/core/instrumentation/hub'];
  let ok = true;
  for (const [mode, res, ext] of [['bundler', ts.ModuleResolutionKind.Bundler, '.ts'], ['node16 (ESM importer)', ts.ModuleResolutionKind.Node16, '.mts'], ['node16 (CJS importer)', ts.ModuleResolutionKind.Node16, '.cts'], ['nodenext (ESM importer)', ts.ModuleResolutionKind.NodeNext, '.mts']]) {
    const opts = { moduleResolution: res, module: res === ts.ModuleResolutionKind.Bundler ? ts.ModuleKind.ESNext : (res === ts.ModuleResolutionKind.Node16 ? ts.ModuleKind.Node16 : ts.ModuleKind.NodeNext), traceResolution: false };
    for (const s of specs) {
      const importer = join(dir, 'src', `probe${ext}`);
      const host = ts.createCompilerHost(opts);
      const r = ts.resolveModuleName(s, importer, opts, host, undefined, undefined, ext === '.cts' ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext);
      const m = r.resolvedModule;
      lines.push(`${mode.padEnd(24)} ${s.padEnd(38)} -> ${m ? m.resolvedFileName.replace(dir, '.') + ` [${m.extension}]` : 'UNRESOLVED'}`);
      if (s === 'typegpu/unstable-instrumentation' && (!m || !m.resolvedFileName.endsWith('core/instrumentation/index.d.ts'))) ok = false;
      if (s === 'typegpu/core/instrumentation/hub' && m) ok = false; // must NOT be deep-importable
    }
  }
  // Node runtime resolution
  const nodeScript = `
    const a = import.meta.resolve('typegpu/unstable-instrumentation');
    const m = await import('typegpu/unstable-instrumentation');
    const { createRequire } = await import('node:module');
    const req = createRequire(import.meta.url);
    let cjs;
    try { cjs = Object.keys(req('typegpu/unstable-instrumentation')).join(','); } catch (e) { cjs = 'ERR ' + e.code; }
    let deep; try { await import('typegpu/core/instrumentation/hub'); deep = 'RESOLVED'; } catch (e) { deep = e.code; }
    console.log(JSON.stringify({ importMetaResolve: a.replace(process.cwd(), '.'), esmExports: Object.keys(m), requireEsm: cjs, deepImport: deep, pkgJson: typeof (await import('typegpu/package.json', { with: { type: 'json' } })).default.version }));`;
  const r = sh('node', ['--input-type=module', '-e', nodeScript]);
  lines.push('', 'node runtime: ' + (r.stdout || r.stderr).trim());
  save('k1c-exports-resolution.txt', lines.join('\n') + '\n');
  record('K1c exports map: entry resolves to core/instrumentation/index.d.ts under bundler/node16/nodenext; hub not deep-importable', ok, '');
  console.log(lines.join('\n'));
}

// ---- (d) runtime against the fake device ----
{
  const r = sh('node', ['src/runtime.ts']);
  save('k1d-runtime-fake-device.txt', r.stdout + r.stderr);
  record('K1d built package runs instrumented app on fake device', r.status === 0 && r.stdout.includes('"k1d": "PASS"'), r.status === 0 ? '' : r.stderr.slice(0, 400));
}
writeFileSync(join(results, 'k1-summary.json'), JSON.stringify(summary, null, 2));
process.exitCode = summary.some((s) => !s.ok) ? 1 : 0;
