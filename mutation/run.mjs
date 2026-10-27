import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const PKG = '/private/tmp/claude-502/-Users-mykhailozuiev-Desktop-type-gpu-fork-TypeGPU/22273805-dfde-4b77-a308-298d24773653/scratchpad/clone-mut2/.work/typegpu/packages/typegpu';
const { mutants } = await import(process.argv[2]);
const only = process.argv[3] ? new Set(process.argv[3].split(',')) : undefined;
const outFile = process.argv[4] ?? 'results.json';
const out = [];
for (const m of mutants) {
  if (only && !only.has(m.id)) continue;
  const path = join(PKG, m.file);
  const orig = readFileSync(path, 'utf8');
  const edits = m.edits ?? [[m.find, m.repl, m.nth]];
  let mutated = orig;
  let bad = '';
  for (const [find, repl, nth] of edits) {
    const positions = [];
    let pos = 0;
    while ((pos = mutated.indexOf(find, pos)) !== -1) { positions.push(pos); pos += find.length; }
    if (positions.length === 0 || (!nth && positions.length > 1)) { bad = `BAD-FIND(${positions.length}) ${find.slice(0, 40)}`; break; }
    const p = positions[(nth ?? 1) - 1];
    mutated = mutated.slice(0, p) + repl + mutated.slice(p + find.length);
  }
  if (bad) { out.push({ id: m.id, result: bad }); console.log(m.id, bad); continue; }
  writeFileSync(path, mutated);
  const failed = [];
  let status = '';
  const t0 = Date.now();
  try {
    const r = spawnSync(join(PKG, '../../node_modules/.bin/vitest'), ['run', 'tests/instrumentation', '--exclude', '**/bench/**', ...(process.env.NO_GAPS2 ? ['--exclude', '**/mutation-gaps2.test.ts'] : []), '--testTimeout=60000', '--reporter=json', '--outputFile=' + join(process.cwd(), 'last.json')], { cwd: PKG, encoding: 'utf8', timeout: 240000 });
    if (r.error) status = 'TIMEOUT/ERR';
    try {
      const j = JSON.parse(readFileSync(join(process.cwd(), 'last.json'), 'utf8'));
      for (const f of j.testResults) {
        if (f.status === 'failed' && f.assertionResults.every((a) => a.status !== 'failed')) failed.push('FILE-ERROR ' + f.name.split('/').pop() + ': ' + (f.message || '').slice(0, 100).replace(/\s+/g, ' '));
        for (const a of f.assertionResults) if (a.status === 'failed') failed.push(a.fullName);
      }
    } catch (e) { status = status || 'NOREPORT'; }
  } finally { writeFileSync(path, orig); }
  const res = failed.length || status ? 'KILLED' : 'SURVIVED';
  out.push({ id: m.id, result: res, status, failed: failed.slice(0, 6), n: failed.length });
  console.log(m.id, res, status, failed.length ? `(${failed.length}) ` + failed[0].slice(0, 100) : '', `${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
writeFileSync(join(process.cwd(), outFile), JSON.stringify(out, null, 1));
