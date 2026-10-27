// Production-style bundle size of two entry points, built from the checkout this runs in (cwd = packages/typegpu).
// Output: JSON on stdout with raw / gzip / brotli bytes per entry. Run once per checkout and compare.
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { createJiti } from 'jiti';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const vitePath = createRequire(require.resolve('vitest/package.json')).resolve('vite');
const { build } = await import(pathToFileURL(vitePath).href);
const typegpu = await createJiti(import.meta.url).import('unplugin-typegpu/vite', {
  default: true,
});

const result = {};
for (const entry of ['bundle-entry-import.ts', 'bundle-entry-app.ts']) {
  const outDir = mkdtempSync(join(tmpdir(), 'tgpu-bundle-'));
  await build({
    root: here,
    configFile: false,
    logLevel: 'silent',
    plugins: [typegpu({ forceTgpuAlias: 'tgpu', earlyPruning: false })],
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      outDir,
      emptyOutDir: true,
      minify: true,
      target: 'esnext',
      lib: { entry: join(here, entry), formats: ['es'], fileName: 'out' },
    },
  });
  const files = readdirSync(outDir).filter((f) => f.endsWith('.js') || f.endsWith('.mjs'));
  const code = Buffer.concat(files.map((f) => readFileSync(join(outDir, f))));
  result[entry] = {
    files: files.length,
    rawBytes: code.length,
    gzipBytes: gzipSync(code, { level: 9 }).length,
    brotliBytes: brotliCompressSync(code).length,
    containsInstrumentationHub: code.includes('pipeline-creation-failed'),
  };
  rmSync(outDir, { recursive: true, force: true });
}
console.log(JSON.stringify(result, null, 2));
