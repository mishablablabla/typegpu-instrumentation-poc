// node alt/bundle.mjs -> JSON: minified production-style bundle sizes (vite lib mode, same settings as real-gpu/bench-page/bundle.mjs)
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';
const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(resolve(here, '..'), '.work/typegpu-pristine/packages/typegpu');
const req = createRequire(join(pkg, 'package.json'));
const { build } = await import(pathToFileURL(createRequire(req.resolve('vitest/package.json')).resolve('vite')).href);
const { createJiti } = await import(pathToFileURL(req.resolve('jiti')).href);
const typegpu = await createJiti(pathToFileURL(join(pkg, 'x.mjs')).href).import('unplugin-typegpu/vite', { default: true });
const result = {};
for (const entry of ['app.ts', 'app-tap-unused.ts', 'app-tap-used.ts', 'tap-only.ts']) {
  const outDir = mkdtempSync(join(tmpdir(), 'alt-bundle-'));
  await build({
    root: join(here, 'bundle'), configFile: false, logLevel: 'silent',
    plugins: [typegpu({ forceTgpuAlias: 'tgpu', earlyPruning: false })],
    resolve: { alias: [{ find: /^typegpu$/, replacement: join(pkg, 'src/index.js') }] },
    define: { 'process.env.NODE_ENV': '"production"' },
    build: { outDir, emptyOutDir: true, minify: true, target: 'esnext', lib: { entry: join(here, 'bundle', entry), formats: ['es'], fileName: 'out' } },
  });
  const code = Buffer.concat(readdirSync(outDir).filter((f) => f.endsWith('.js') || f.endsWith('.mjs')).map((f) => readFileSync(join(outDir, f))));
  result[entry] = { rawBytes: code.length, gzipBytes: gzipSync(code, { level: 9 }).length, brotliBytes: brotliCompressSync(code).length, containsTapCode: code.includes('shader-diagnostics') };
  rmSync(outDir, { recursive: true, force: true });
}
console.log(JSON.stringify(result, null, 2));
