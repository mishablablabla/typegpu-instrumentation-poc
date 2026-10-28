// Builds alt/page (or another entry dir) against the PRISTINE (unpatched) TypeGPU checkout.
//   [NODE_ENV=development] node alt/build.mjs <outDir> [pageDir=alt/page] [tree=.work/typegpu-pristine]
// `typegpu` is aliased to the checkout's sources; unplugin-typegpu/Vite are the ones TypeGPU's own tests use.
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const outDir = resolve(process.argv[2]);
const pageDir = resolve(process.argv[3] ?? join(here, 'page'));
const tree = resolve(process.argv[4] ?? join(repo, '.work/typegpu-pristine'));
const pkg = join(tree, 'packages/typegpu');
const req = createRequire(join(pkg, 'package.json'));
const vitePath = createRequire(req.resolve('vitest/package.json')).resolve('vite');
const { build } = await import(pathToFileURL(vitePath).href);
const { createJiti } = await import(pathToFileURL(req.resolve('jiti')).href);
const typegpu = await createJiti(pathToFileURL(join(pkg, 'x.mjs')).href).import('unplugin-typegpu/vite', { default: true });

await build({
  root: pageDir,
  configFile: false,
  logLevel: 'warn',
  base: './',
  plugins: [typegpu({ forceTgpuAlias: 'tgpu', earlyPruning: false })],
  resolve: { alias: [{ find: /^typegpu$/, replacement: join(pkg, 'src/index.js') }] },
  define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production') },
  server: { fs: { strict: false } },
  build: { outDir, emptyOutDir: true, minify: false, target: 'esnext' },
});
