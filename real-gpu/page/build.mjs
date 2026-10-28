// Bundles the validation page with the same unplugin and Vite that TypeGPU's own Vitest setup uses.
// Runs with cwd = packages/typegpu of the patched checkout (real-gpu/run.mjs arranges that).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createJiti } from 'jiti';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2];
// The scenario run by `window.runExample()`; must live inside the checkout so `typegpu` resolves.
const examplePath = process.argv[3];
const require = createRequire(import.meta.url);
// `vite` is not a direct dependency of the package; resolve it the way vitest sees it.
const vitePath = createRequire(require.resolve('vitest/package.json')).resolve('vite');
const { build } = await import(pathToFileURL(vitePath).href);
const jiti = createJiti(import.meta.url);
const typegpu = await jiti.import('unplugin-typegpu/vite', { default: true });

await build({
  root: here,
  configFile: false,
  logLevel: 'warn',
  base: './',
  plugins: [typegpu({ forceTgpuAlias: 'tgpu', earlyPruning: false })],
  resolve: { alias: { 'example-under-test': examplePath } },
  // What an application bundle looks like: NODE_ENV=production, so TypeGPU's DEV-only code is absent.
  define: { 'process.env.NODE_ENV': '"production"' },
  build: { outDir: join(outDir), emptyOutDir: true, minify: false, target: 'esnext' },
});
