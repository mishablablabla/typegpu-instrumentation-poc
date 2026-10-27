#!/usr/bin/env node
// In-browser overhead experiment: the same workload against four configurations, each in a FRESH Chrome
// process, order rotated every repetition:
//   pristine    upstream TypeGPU, no patch
//   pristine-b  an identical second copy (A/A control: any difference is measurement bias)
//   disabled    patched TypeGPU, instrumentation not requested
//   enabled     patched TypeGPU, instrumentation requested
// Needs scripts/setup.sh and scripts/setup-pristine.sh. CPU-side timings of the JavaScript calls only.
//   REPS=9 node real-gpu/overhead.mjs        -> real-gpu/results/overhead-<stamp>.jsonl
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPS = Number(process.env.REPS ?? 9);
const trees = {
  pristine: join(root, '.work/typegpu-pristine'),
  'pristine-b': join(root, '.work/typegpu-pristine-b'),
  patched: join(root, '.work/typegpu'),
};
const configs = [
  { name: 'pristine', tree: 'pristine', instrumentation: false },
  { name: 'pristine-b', tree: 'pristine-b', instrumentation: false },
  { name: 'disabled', tree: 'patched', instrumentation: false },
  { name: 'enabled', tree: 'patched', instrumentation: true },
];

const sh = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) {
    console.error(`${cmd} ${args.join(' ')} failed (${r.status})`);
    process.exit(3);
  }
};

// Put the page into every tree and build it once per tree.
const dist = {};
for (const [name, tree] of Object.entries(trees)) {
  const pkg = join(tree, 'packages/typegpu');
  const page = join(pkg, 'tests/instrumentation/real-gpu-bench');
  sh('mkdir', ['-p', page]);
  sh('rsync', ['-a', '--delete', `${join(root, 'real-gpu/bench-page')}/`, `${page}/`]);
  sh('cp', [join(root, 'real-gpu/page/provenance.ts'), join(page, 'provenance.ts')]);
  dist[name] = join(root, `.work/bench-dist-${name}`);
  sh('node', [join(page, 'build.mjs'), dist[name]], { cwd: pkg });
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = join(root, 'real-gpu/results', `overhead-${stamp}.jsonl`);
const tmp = join(root, '.work/overhead-run.json');
mkdirSync(dirname(out), { recursive: true });

let order = [...configs];
for (let rep = 1; rep <= REPS; rep++) {
  for (const config of order) {
    const r = spawnSync(
      'node',
      [
        join(root, 'real-gpu/run.mjs'),
        '--tree', trees[config.tree],
        '--page', 'real-gpu-bench',
        '--dist', dist[config.tree],
        '--skip-build',
        '--ready', 'typeof window.runBench === "function"',
        '--call', `window.runBench({ instrumentation: ${config.instrumentation} })`,
        '--out', tmp,
      ],
      { encoding: 'utf8' },
    );
    if (r.status !== 0) {
      console.error(`${config.name} rep ${rep} failed (exit ${r.status}):\n${r.stdout}\n${r.stderr}`);
      process.exit(r.status === 2 ? 2 : 1);
    }
    const result = JSON.parse(readFileSync(tmp, 'utf8'));
    if (result.hasInstrumentation !== config.instrumentation) {
      console.error(`${config.name}: hasInstrumentation=${result.hasInstrumentation}, expected ${config.instrumentation}`);
      process.exit(1);
    }
    appendFileSync(out, JSON.stringify({ config: config.name, rep, ...result }) + '\n');
  }
  order = [...order.slice(1), order[0]];
  console.error(`rep ${rep}/${REPS} done`);
}
rmSync(tmp, { force: true });
console.log(out);
