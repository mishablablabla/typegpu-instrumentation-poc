// Builds this page from whichever TypeGPU checkout it is run in (cwd = packages/typegpu). It imports only
// typegpu's public API plus `./provider.ts`, which is swapped at build time:
//   node build.mjs <outDir> pristine|patched [padding]
// `padding` changes the page's code (a dead string constant of that many bytes) so a rebuilt A/A copy differs
// from its twin in layout and hash while running identical logic.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createJiti } from 'jiti';

const here = dirname(fileURLToPath(import.meta.url));
const [outDir, mode = 'patched', padding = '0'] = process.argv.slice(2);
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
  resolve: {
    alias: [{ find: /^\.\/provider\.ts$/, replacement: join(here, `provider.${mode}.ts`) }],
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    __PADDING__: JSON.stringify('x'.repeat(Number(padding))),
  },
  build: { outDir, emptyOutDir: true, minify: false, target: 'esnext' },
});
