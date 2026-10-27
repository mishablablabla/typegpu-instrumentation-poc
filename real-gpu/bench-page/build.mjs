// Builds this page from whichever TypeGPU checkout it is run in (cwd = packages/typegpu). It imports only
// typegpu's public API, so the identical page runs against the pristine and the patched checkout.
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createJiti } from 'jiti';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2];
const require = createRequire(import.meta.url);
const vitePath = createRequire(require.resolve('vitest/package.json')).resolve('vite');
const { build } = await import(pathToFileURL(vitePath).href);
const typegpu = await createJiti(import.meta.url).import('unplugin-typegpu/vite', {
  default: true,
});

await build({
  root: here,
  configFile: false,
  logLevel: 'warn',
  base: './',
  plugins: [typegpu({ forceTgpuAlias: 'tgpu', earlyPruning: false })],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: { outDir, emptyOutDir: true, minify: false, target: 'esnext' },
});
