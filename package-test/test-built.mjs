#!/usr/bin/env node
// K1(d, upstream switch): run the instrumentation vitest suite against the BUILT package (TEST_BUILT=1 aliases
// typegpu -> typegpu/$built$), then prove the switch really consumes dist by sabotaging dist and expecting a failure.
import { spawnSync } from 'node:child_process';
import { copyFileSync, appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pkgDir, results } from './lib/paths.mjs';

mkdirSync(results, { recursive: true });
const cwd = pkgDir('patched');
const vt = (args) => spawnSync('pnpm', ['vitest', 'run', ...args], { cwd, encoding: 'utf8', env: { ...process.env, TEST_BUILT: '1' } });
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
let log = '';

const r = vt(['tests/instrumentation', '--exclude', '**/bench/**']);
log += `$ TEST_BUILT=1 pnpm vitest run tests/instrumentation --exclude '**/bench/**'  (cwd packages/typegpu)\nexit ${r.status}\n${strip(r.stdout + r.stderr)}\n`;

const target = join(cwd, 'dist/core/instrumentation/index.js');
copyFileSync(target, target + '.bak');
try {
  appendFileSync(target, "\nthrow new Error('SABOTAGE-DIST');\n");
  const s = vt(['tests/instrumentation/exportConsumers.test.ts']);
  log += `\n--- sabotage check: dist/core/instrumentation/index.js made to throw; TEST_BUILT=1 must FAIL ---\nexit ${s.status}\n${strip(s.stdout + s.stderr).split('\n').filter((l) => /SABOTAGE|Test Files|Tests /.test(l)).join('\n')}\n`;
  var sabotageFailed = s.status !== 0;
} finally {
  copyFileSync(target + '.bak', target);
  spawnSync('rm', ['-f', target + '.bak']);
}
writeFileSync(join(results, 'k1d-test-built.txt'), log);
console.log(`${r.status === 0 ? 'PASS' : 'FAIL'}  K1d TEST_BUILT=1 vitest tests/instrumentation (exit ${r.status}); sabotage ${sabotageFailed ? 'detected (switch really uses dist)' : 'NOT detected'}`);
process.exitCode = r.status === 0 && sabotageFailed ? 0 : 1;
