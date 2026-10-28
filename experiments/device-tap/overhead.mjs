#!/usr/bin/env node
// Overhead of the device tap: N fresh Chrome processes, each running the same page that holds four devices
// (plain / tap-lite / tap-full / tap-full-nostrip) with interleaved samples; order rotated per process.
//   REPS=7 SAMPLES=30 node alt/overhead.mjs [distDir]  ->  alt/results/overhead-<stamp>.jsonl
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPS = Number(process.env.REPS ?? 7);
const SAMPLES = Number(process.env.SAMPLES ?? 30);
const dist = resolve(process.argv[2] ?? join(repo, 'alt/dist/main'));
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = join(repo, 'alt/results', `overhead-${stamp}.jsonl`);
const tmp = join(repo, '.work/alt-overhead-run.json');
mkdirSync(dirname(out), { recursive: true });
for (let rep = 0; rep < REPS; rep++) {
  const r = spawnSync('node', [
    join(repo, 'real-gpu/run.mjs'), '--tree', join(repo, '.work/typegpu-pristine'), '--dist', dist, '--skip-build',
    '--ready', 'typeof window.runBenchAlt === "function"',
    '--call', `window.runBenchAlt({ samples: ${SAMPLES}, warmupBatches: 4, rotate: ${rep} })`, '--out', tmp,
  ], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(`process ${rep} failed (${r.status})\n${r.stdout}\n${r.stderr}`); process.exit(1); }
  appendFileSync(out, JSON.stringify({ process: rep, ...JSON.parse(readFileSync(tmp, 'utf8')) }) + '\n');
  console.error(`process ${rep + 1}/${REPS} done`);
}
rmSync(tmp, { force: true });
console.log(out);
