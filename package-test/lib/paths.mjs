import { readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = resolve(dirname(fileURLToPath(import.meta.url)), '..'); // package-test/
export const root = resolve(here, '..'); // repo root (clone)
export const trees = {
  pristine: join(root, '.work/typegpu-pristine'),
  patched: join(root, '.work/typegpu'),
};
export const pkgDir = (tree) => join(trees[tree], 'packages/typegpu');
export const pnpmStore = join(trees.patched, 'node_modules/.pnpm');
export const results = join(here, 'results');

/** Finds `<store>/<prefix>*` / node_modules / name (first match, sorted so the result is deterministic). */
export function fromStore(dirPrefix, name) {
  const hit = readdirSync(pnpmStore)
    .filter((d) => d.startsWith(dirPrefix))
    .sort()[0];
  if (!hit) throw new Error(`not in pnpm store: ${dirPrefix}`);
  const p = join(pnpmStore, hit, 'node_modules', name);
  if (!existsSync(p)) throw new Error(`missing ${p}`);
  return p;
}

import { cpSync, mkdirSync, readFileSync, readdirSync as readDir, writeFileSync } from 'node:fs';
export const tsc = () => join(fromStore('tsover@', 'tsover'), 'bin/tsc');
export const tsLib = () => join(fromStore('tsover@', 'tsover'), 'lib/typescript.js');

/** Copies the consumer sources (not package.json, which `stage.mjs` generated with the tarball deps) into work/<tree>/. */
export function syncConsumer(tree) {
  const dst = join(here, 'work', tree);
  mkdirSync(dst, { recursive: true });
  for (const f of ['src', 'apps', 'tsconfig.base.json', 'tsconfig.bundler.json', 'tsconfig.node10.json', 'tsconfig.node16.json', 'tsconfig.nodenext.json']) {
    cpSync(join(here, 'consumer', f), join(dst, f), { recursive: true });
  }
  // The ready-made consumers (consumers/) are written against the patched work tree; outside it they import the
  // same types from the package entry point. The documentation snippets import them from `src/consumers/`.
  const consumersDst = join(dst, 'src/consumers');
  mkdirSync(consumersDst, { recursive: true });
  for (const f of readDir(join(root, 'consumers')).filter((name) => name.endsWith('.ts'))) {
    const source = readFileSync(join(root, 'consumers', f), 'utf8');
    writeFileSync(join(consumersDst, f), source.replaceAll("'../../../src/core/instrumentation/types.ts'", "'typegpu/unstable-instrumentation'"));
  }
  return dst;
}
