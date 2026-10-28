#!/usr/bin/env node
// Sustained-use run: does steady event generation grow memory or slow the application down?
// Each run is a fresh Chrome process (precise memory info on) executing `runSustained` for SECONDS seconds:
// a loop that creates/destroys a buffer, creates a bind group, dispatches, and now and then creates a pipeline.
// Once per second it forces a collection and records the heap, operations per second and the history state.
//   REPS=3 SECONDS=60 node real-gpu/sustained.mjs          -> real-gpu/results/sustained-<stamp>.jsonl + summary table
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPS = Number(process.env.REPS ?? 3);
const SECONDS = Number(process.env.SECONDS ?? 60);
const WARMUP = Number(process.env.WARMUP ?? 15);
const configs = [
  { name: 'disabled', instrumentation: null },
  { name: 'enabled', instrumentation: { subscriber: 'none' } },
  { name: 'enabled-noop', instrumentation: { subscriber: 'noop' } },
  { name: 'enabled-h0', instrumentation: { subscriber: 'noop', historySize: 0 } },
];
const pkg = join(root, '.work/typegpu/packages/typegpu');
const page = join(pkg, 'tests/instrumentation/real-gpu-bench');
const dist = join(root, '.work/bench-dist-patched');
const sh = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(3);
};
sh('mkdir', ['-p', page]);
sh('rsync', ['-a', '--delete', `${join(root, 'real-gpu/bench-page')}/`, `${page}/`]);
sh('cp', [join(root, 'real-gpu/page/provenance.ts'), join(page, 'provenance.ts')]);
sh('node', [join(page, 'build.mjs'), dist, 'patched', '0'], { cwd: pkg });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = join(root, 'real-gpu/results', `sustained-${stamp}.jsonl`);
const tmp = join(root, `.work/sustained-${process.pid}.json`);
mkdirSync(dirname(out), { recursive: true });

const slope = (xs, ys) => {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b) / n;
  const my = ys.reduce((a, b) => a + b) / n;
  return xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
};
const median = (xs) => xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)];

const rows = [];
for (let rep = 1; rep <= REPS; rep++) {
  for (const config of configs) {
    const benchConfig = { instrumentation: config.instrumentation, seconds: SECONDS, warmupSeconds: WARMUP };
    const r = spawnSync('node', [
      join(root, 'real-gpu/run.mjs'), '--tree', join(root, '.work/typegpu'), '--page', 'real-gpu-bench', '--dist', dist, '--skip-build',
      '--chrome-arg=--enable-precise-memory-info', '--eval-timeout', String((SECONDS + 60) * 1000),
      '--ready', 'typeof window.runSustained === "function"', '--call', `window.runSustained(${JSON.stringify(benchConfig)})`, '--out', tmp,
    ], { encoding: 'utf8' });
    if (r.status !== 0) {
      console.error(`${config.name} rep ${rep} failed (exit ${r.status}):\n${r.stdout}\n${r.stderr}`);
      process.exit(1);
    }
    const result = JSON.parse(readFileSync(tmp, 'utf8'));
    appendFileSync(out, JSON.stringify({ ...result, config: config.name, rep }) + '\n');
    const tail = result.points.filter((p) => p.second > WARMUP);
    const heapSlope = tail.every((p) => p.heapBytes !== null) ? slope(tail.map((p) => p.second), tail.map((p) => p.heapBytes)) : null;
    const opsSlope = slope(tail.map((p) => p.second), tail.map((p) => p.opsPerSecond));
    rows.push({ config: config.name, rep, heapSlope, opsMedian: median(tail.map((p) => p.opsPerSecond)), opsSlope, last: result.points.at(-1) });
    console.error(`rep ${rep} ${config.name}: heap slope ${heapSlope === null ? 'n/a' : `${(heapSlope / 1024).toFixed(1)} KiB/s`}, ops/s median ${rows.at(-1).opsMedian}`);
  }
}
rmSync(tmp, { force: true });
console.log(`\n${SECONDS} s per run, trend measured after ${WARMUP} s warm-up; heap read after a forced collection once per second\n`);
console.log('| config | heap slope KiB/s (per rep) | ops/s median (per rep) | ops/s slope per s (per rep) | history length / bytes at end | dropped events at end |');
console.log('|---|---|---|---|---|---|');
for (const config of configs) {
  const mine = rows.filter((r) => r.config === config.name);
  console.log(`| ${config.name} | ${mine.map((r) => (r.heapSlope === null ? 'n/a' : (r.heapSlope / 1024).toFixed(1))).join(', ')} | ${mine.map((r) => r.opsMedian).join(', ')} | ${mine.map((r) => r.opsSlope.toFixed(1)).join(', ')} | ${mine.at(-1).last.historyLength} / ${mine.at(-1).last.historyBytes} | ${mine.at(-1).last.droppedEvents} |`);
}
console.log(out);
