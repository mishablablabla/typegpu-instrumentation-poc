#!/usr/bin/env node
// Production-style bundle size, pristine TypeGPU vs patched TypeGPU, for two entry points (see bench-page/).
// Needs scripts/setup.sh and scripts/setup-pristine.sh. Writes real-gpu/results/bundle-size.json.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const measure = (tree) => {
  const pkg = join(root, '.work', tree, 'packages/typegpu');
  const page = join(pkg, 'tests/instrumentation/real-gpu-bench');
  spawnSync('mkdir', ['-p', page]);
  spawnSync('rsync', ['-a', '--delete', `${join(root, 'real-gpu/bench-page')}/`, `${page}/`]);
  spawnSync('cp', [join(root, 'real-gpu/page/provenance.ts'), join(page, 'provenance.ts')]);
  const r = spawnSync('node', [join(page, 'bundle.mjs')], { cwd: pkg, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(3);
  }
  return JSON.parse(r.stdout);
};

const pristine = measure('typegpu-pristine');
const patched = measure('typegpu');
const out = { measured: new Date().toISOString(), note: 'vite build, minify, NODE_ENV=production, lib mode, es format', pristine, patched };
mkdirSync(join(root, 'real-gpu/results'), { recursive: true });
writeFileSync(join(root, 'real-gpu/results/bundle-size.json'), JSON.stringify(out, null, 2) + '\n');

console.log('| entry | metric | pristine | patched | delta |');
console.log('|---|---|---|---|---|');
for (const entry of Object.keys(pristine)) {
  for (const metric of ['rawBytes', 'gzipBytes', 'brotliBytes']) {
    const a = pristine[entry][metric];
    const b = patched[entry][metric];
    console.log(`| ${entry} | ${metric} | ${a} | ${b} | +${b - a} (${(((b - a) / a) * 100).toFixed(1)} %) |`);
  }
}
