#!/usr/bin/env node
// In-browser overhead experiment. The same page runs in a FRESH Chrome process per measurement against:
//   pristine, pristine-b, pristine-c   unpatched upstream; b and c are REBUILT with different page padding, so
//                                      they differ in layout/hash but run identical logic (the A/A noise band)
//   disabled                           patched TypeGPU, instrumentation not requested
//   enabled-h0                         requested, historySize 0, no subscriber
//   enabled                            requested, default history, no subscriber
//   enabled-noop                       ... plus a subscriber that does nothing
//   enabled-console                    ... plus the console reporter writing to a counting stub
//   enabled-jsonl                      ... plus the JSONL exporter (in memory)
// Block design: each block runs every configuration once, in a freshly randomised (seeded) order.
//   BLOCKS=24 node real-gpu/overhead.mjs        -> real-gpu/results/overhead2-<stamp>.jsonl
// Env: BLOCKS, SAMPLES, OPS (comma separated names), CONFIGS (comma separated names), SEED.
// CPU-side timings of the JavaScript calls only; no GPU time is measured or claimed.
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BLOCKS = Number(process.env.BLOCKS ?? 12);
const SAMPLES = Number(process.env.SAMPLES ?? 60);
const SEED = Number(process.env.SEED ?? 20261027);
const OPS = process.env.OPS ? process.env.OPS.split(',') : undefined;
const trees = {
  pristine: join(root, '.work/typegpu-pristine'),
  patched: join(root, '.work/typegpu'),
};
const builds = {
  pristine: { tree: 'pristine', mode: 'pristine', padding: 0 },
  'pristine-b': { tree: 'pristine', mode: 'pristine', padding: 997 },
  'pristine-c': { tree: 'pristine', mode: 'pristine', padding: 1999 },
  patched: { tree: 'patched', mode: 'patched', padding: 0 },
};
const inst = (subscriber, extra = {}) => ({ subscriber, ...extra });
const allConfigs = [
  { name: 'pristine', build: 'pristine', instrumentation: null },
  { name: 'pristine-b', build: 'pristine-b', instrumentation: null },
  { name: 'pristine-c', build: 'pristine-c', instrumentation: null },
  { name: 'disabled', build: 'patched', instrumentation: null },
  { name: 'enabled-h0', build: 'patched', instrumentation: inst('none', { historySize: 0 }) },
  { name: 'enabled', build: 'patched', instrumentation: inst('none') },
  { name: 'enabled-noop', build: 'patched', instrumentation: inst('noop') },
  { name: 'enabled-console', build: 'patched', instrumentation: inst('console-stub') },
  { name: 'enabled-jsonl', build: 'patched', instrumentation: inst('jsonl') },
];
const wanted = process.env.CONFIGS?.split(',');
const configs = wanted ? allConfigs.filter((c) => wanted.includes(c.name)) : allConfigs;

const sh = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) {
    console.error(`${cmd} ${args.join(' ')} failed (${r.status})`);
    process.exit(3);
  }
};

const dist = {};
const prepared = new Set();
for (const name of new Set(configs.map((c) => c.build))) {
  const { tree, mode, padding } = builds[name];
  const pkg = join(trees[tree], 'packages/typegpu');
  const page = join(pkg, 'tests/instrumentation/real-gpu-bench');
  if (!prepared.has(tree)) {
    sh('mkdir', ['-p', page]);
    sh('rsync', ['-a', '--delete', `${join(root, 'real-gpu/bench-page')}/`, `${page}/`]);
    sh('cp', [join(root, 'real-gpu/page/provenance.ts'), join(page, 'provenance.ts')]);
    prepared.add(tree);
  }
  dist[name] = join(root, `.work/bench-dist-${name}`);
  sh('node', [join(page, 'build.mjs'), dist[name], mode, String(padding)], { cwd: pkg });
}

// Seeded shuffle so a run can be reproduced exactly.
let state = SEED >>> 0;
const rand = () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 2 ** 32;
};
const shuffled = (xs) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = join(root, 'real-gpu/results', `overhead2-${stamp}.jsonl`);
const tmp = join(root, `.work/overhead-run-${process.pid}.json`);
mkdirSync(dirname(out), { recursive: true });

for (let block = 1; block <= BLOCKS; block++) {
  const order = shuffled(configs);
  for (const [position, config] of order.entries()) {
    const benchConfig = { instrumentation: config.instrumentation, samples: SAMPLES, ...(OPS ? { ops: OPS } : {}) };
    const tree = trees[builds[config.build].tree];
    const r = spawnSync(
      'node',
      [
        join(root, 'real-gpu/run.mjs'),
        '--tree', tree,
        '--page', 'real-gpu-bench',
        '--dist', dist[config.build],
        '--skip-build',
        '--ready', 'typeof window.runBench === "function"',
        '--call', `window.runBench(${JSON.stringify(benchConfig)})`,
        '--out', tmp,
      ],
      { encoding: 'utf8' },
    );
    if (r.status !== 0) {
      console.error(`${config.name} block ${block} failed (exit ${r.status}):\n${r.stdout}\n${r.stderr}`);
      process.exit(r.status === 2 ? 2 : 1);
    }
    const result = JSON.parse(readFileSync(tmp, 'utf8'));
    const wantsInstrumentation = config.instrumentation !== null;
    if (result.hasInstrumentation !== wantsInstrumentation) {
      console.error(`${config.name}: hasInstrumentation=${result.hasInstrumentation}, expected ${wantsInstrumentation}`);
      process.exit(1);
    }
    if (wantsInstrumentation && Object.values(result.ops).some((o) => o.verified === false)) {
      console.error(`${config.name} block ${block}: an operation did not do the work it claims (verified=false)`);
      process.exit(1);
    }
    appendFileSync(out, JSON.stringify({ ...result, config: config.name, block, position }) + '\n');
  }
  console.error(`block ${block}/${BLOCKS} done`);
}
rmSync(tmp, { force: true });
console.log(out);
