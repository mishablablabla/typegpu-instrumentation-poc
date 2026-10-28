#!/usr/bin/env node
// Builds typegpu (pristine + patched) with upstream's own `pnpm build`, replicates packages/tgpu-dev-cli/prepack.mjs's
// package.json transform into a staging dir (no publish), `npm pack`s it, and materialises one offline
// consumer install per tree (npm install --offline from local tarballs). No network is used.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fromStore, here, pkgDir, root, trees } from './lib/paths.mjs';

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    env: { ...process.env, npm_config_offline: 'true', npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false' },
    ...opts,
  });
  if (r.status !== 0) {
    console.error(`FAILED: ${cmd} ${args.join(' ')}\n${r.stdout}\n${r.stderr}`);
    process.exit(2);
  }
  return r.stdout;
};

// --- the prepack.mjs transform, verbatim logic (deepMapStrings + publishConfig swap) ---
function deepMapStrings(value, transform, path = '') {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepMapStrings(v, transform, `${path}.${k}`)]));
  if (typeof value === 'string') return transform(path, value);
  return value;
}
function distPackageJson(packageJson, workspaceVersions) {
  let d = structuredClone(packageJson);
  if (d.publishConfig?.main) d.main = d.publishConfig.main;
  if (d.publishConfig?.types) d.types = d.publishConfig.types;
  if (d.publishConfig?.exports) d.exports = d.publishConfig.exports;
  d.publishConfig = undefined;
  d = deepMapStrings(d, (_p, v) => {
    if (v.startsWith('./dist/')) return v.replace(/^\.\/dist/, '.');
    if (v.startsWith('./src/')) return v.replace(/^\.\/src/, '.');
    return v;
  });
  for (const [k, spec] of Object.entries(d.dependencies ?? {})) {
    if (spec === '*' || spec === 'workspace:*') throw new Error(`wildcard dep ${k}`);
    // What `pnpm publish` does (not part of prepack.mjs): workspace:~ -> ~<version>
    if (spec.startsWith('workspace:')) {
      const range = spec.slice('workspace:'.length);
      d.dependencies[k] = `${range === '~' || range === '^' ? range : ''}${workspaceVersions[k]}`;
    }
  }
  d.private = false;
  d.scripts = {};
  d.devDependencies = undefined;
  return d;
}

function stageAndPack(srcPkgDir, stageDir, tarDir, workspaceVersions) {
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });
  cpSync(join(srcPkgDir, 'dist'), stageDir, { recursive: true });
  const pj = JSON.parse(readFileSync(join(srcPkgDir, 'package.json'), 'utf8'));
  writeFileSync(join(stageDir, 'package.json'), JSON.stringify(distPackageJson(pj, workspaceVersions), undefined, 2));
  const readme = join(srcPkgDir, 'README.md');
  if (existsSync(readme)) writeFileSync(join(stageDir, 'README.md'), readFileSync(readme, 'utf8').replace(/!.*#gh-dark-mode-only\)/, ''));
  mkdirSync(tarDir, { recursive: true });
  const out = run('npm', ['pack', '--pack-destination', tarDir, '--json'], { cwd: stageDir });
  return join(tarDir, JSON.parse(out)[0].filename);
}

const tarDir = join(here, 'tarballs');
rmSync(tarDir, { recursive: true, force: true });
mkdirSync(tarDir, { recursive: true });

// tinyest (workspace dependency of typegpu): built by its own `pnpm build` (tsdown), packed the same way.
const tinyestDir = join(trees.patched, 'packages/tinyest');
console.log('build tinyest');
run('pnpm', ['build'], { cwd: tinyestDir });
const tinyestVersion = JSON.parse(readFileSync(join(tinyestDir, 'package.json'), 'utf8')).version;
const tinyestTar = stageAndPack(tinyestDir, join(here, 'stage/tinyest'), tarDir, {});

// third-party packages, packed from the pnpm store (already installed; no registry access)
const packDir = (dir, name) => {
  const out = run('npm', ['pack', '--pack-destination', tarDir, '--json'], { cwd: dir });
  return join(tarDir, JSON.parse(out)[0].filename);
};
const typedBinaryTar = packDir(fromStore('typed-binary@', 'typed-binary'));
const tsoverRuntimeTar = packDir(fromStore('tsover-runtime@', 'tsover-runtime'));
const webgpuTypesTar = packDir(fromStore('@webgpu+types@', '@webgpu/types'));

const tars = { tinyest: tinyestTar, typedBinary: typedBinaryTar, tsoverRuntime: tsoverRuntimeTar, webgpuTypes: webgpuTypesTar };

for (const tree of ['pristine', 'patched']) {
  console.log(`build + pack typegpu (${tree})`);
  run('pnpm', ['build'], { cwd: pkgDir(tree) });
  const tgz = stageAndPack(pkgDir(tree), join(here, `stage/typegpu-${tree}`), join(tarDir, tree), { tinyest: tinyestVersion });
  tars[`typegpu-${tree}`] = tgz;

  // One consumer install per tree: real `npm install` (offline), tarballs only.
  const dir = join(here, 'work', tree);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: `consumer-${tree}`,
        private: true,
        type: 'module',
        dependencies: { typegpu: `file:${tgz}` },
        devDependencies: { '@webgpu/types': `file:${webgpuTypesTar}` },
        overrides: {
          tinyest: `file:${tinyestTar}`,
          'typed-binary': `file:${typedBinaryTar}`,
          'tsover-runtime': `file:${tsoverRuntimeTar}`,
        },
      },
      undefined,
      2,
    ),
  );
  const log = run('npm', ['install', '--offline', '--no-audit', '--no-fund', '--install-links=false'], { cwd: dir });
  console.log(log.trim() || '(npm install ok)');
}
writeFileSync(join(here, 'tarballs/manifest.json'), JSON.stringify(tars, undefined, 2));
console.log(JSON.stringify(tars, undefined, 2));
