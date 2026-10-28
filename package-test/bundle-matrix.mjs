#!/usr/bin/env node
// B1/B2: bundle matrix over the PACKED typegpu (package-test/work/<tree>/node_modules/typegpu), one config per bundler.
// Needs `node stage.mjs` first. Writes results/bundle-matrix.{json,md} and results/bundle-markers.txt.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { fromStore, here, pkgDir, results, root, syncConsumer } from './lib/paths.mjs';

mkdirSync(results, { recursive: true });
const req = createRequire(pkgDir('patched') + '/package.json');
const load = async (p) => import(pathToFileURL(createRequire(import.meta.url).resolve(p)).href);

const MARKERS = ['pipeline-created', 'pipeline-creation-failed', 'uncapturederror', 'FinalizationRegistry', 'resource-materialized', 'bind-group-created', 'device-lost', 'root-destroyed', 'gpuExecutionTime'];
const HOOK_SITES = ['bufferMaterialized', 'textureMaterialized', 'bufferWritten', 'resourceDestroyed', 'bindGroupCreated', 'pipelineCreated', 'pipelineCreationFailed', 'dispatched', 'drew', 'submitted', 'rootDestroyed'];

const dirs = { pristine: syncConsumer('pristine'), patched: syncConsumer('patched') };
const tmp = () => mkdtempSync(join(tmpdir(), 'tgpu-bm-'));
const readOut = (d) => Buffer.concat(readdirSync(d).filter((f) => /\.m?js$/.test(f)).sort().map((f) => readFileSync(join(d, f))));

// ---------------- bundlers: (tree, entryFile, minify) -> Buffer of JS ----------------
const bundlers = {};

{ // Vite 8 (rolldown + oxc minifier), exactly the version vitest uses in this repo
  const vitePath = createRequire(req.resolve('vitest/package.json')).resolve('vite');
  const { build, version } = await import(pathToFileURL(vitePath).href);
  const { createJiti } = await import(pathToFileURL(req.resolve('jiti')).href);
  const unplugin = await createJiti(import.meta.url).import(join(root, '.work/typegpu/packages/unplugin-typegpu/src/vite.ts'), { default: true });
  bundlers.vite = {
    label: `vite ${version} (rolldown, oxc minify)`,
    async run(dir, entry, minify, { kernels = false } = {}) {
      const outDir = tmp();
      await build({
        root: dir, configFile: false, logLevel: 'silent',
        plugins: kernels ? [unplugin({ forceTgpuAlias: 'tgpu', earlyPruning: false })] : [],
        define: { 'process.env.NODE_ENV': '"production"' },
        build: { outDir, emptyOutDir: true, minify, target: 'esnext', lib: { entry: join(dir, 'apps', entry), formats: ['es'], fileName: 'out' } },
      });
      const out = readOut(outDir); rmSync(outDir, { recursive: true, force: true }); return out;
    },
  };
}

{ // esbuild 0.27.5
  const esbuild = createRequire(import.meta.url)(fromStore('esbuild@0.27.5', 'esbuild'));
  bundlers.esbuild = {
    label: `esbuild ${esbuild.version}`,
    async run(dir, entry, minify) {
      const r = await esbuild.build({
        entryPoints: [join(dir, 'apps', entry)], absWorkingDir: dir, bundle: true, format: 'esm', platform: 'browser', target: 'esnext',
        minify, write: false, logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' },
      });
      return Buffer.concat(r.outputFiles.map((f) => Buffer.from(f.contents)));
    },
  };
}

{ // webpack 5, Node API, mode production (tree-shaking + module concatenation on; minimize toggled)
  const webpack = createRequire(import.meta.url)(fromStore('webpack@5.104.1', 'webpack'));
  bundlers.webpack = {
    label: `webpack ${webpack.version} (production, terser)`,
    run(dir, entry, minify) {
      const outDir = tmp();
      return new Promise((resolve, reject) => {
        webpack({
          mode: 'production', context: dir, entry: join(dir, 'apps', entry), devtool: false, target: ['web', 'es2022'],
          output: { path: outDir, filename: 'out.js', module: true, library: { type: 'module' }, chunkFormat: 'module' },
          experiments: { outputModule: true }, optimization: { minimize: minify }, performance: { hints: false },
        }, (err, stats) => {
          if (err || stats.hasErrors()) return reject(err ?? new Error(stats.toString({ all: false, errors: true })));
          const out = readOut(outDir); rmSync(outDir, { recursive: true, force: true }); resolve(out);
        });
      });
    },
  };
}

{ // Rollup 4 + @rollup/plugin-node-resolve; minified with terser as a post-pass (rollup has no minifier of its own)
  const R = createRequire(import.meta.url);
  const { rollup, VERSION } = R(fromStore('rollup@4', 'rollup'));
  const nodeResolve = R(fromStore('@rollup+plugin-node-resolve@', '@rollup/plugin-node-resolve')).nodeResolve;
  const terser = R(fromStore('terser@5.44', 'terser'));
  bundlers.rollup = {
    label: `rollup ${VERSION} + node-resolve; minify = terser ${R(fromStore('terser@5.44', 'terser') + '/package.json').version} post-pass`,
    async run(dir, entry, minify) {
      const bundle = await rollup({ input: join(dir, 'apps', entry), plugins: [nodeResolve({ browser: true, exportConditions: ['browser', 'import', 'module', 'default'] })], onwarn() {} });
      const { output } = await bundle.generate({ format: 'es' });
      await bundle.close();
      let code = output.map((o) => o.code).join('\n');
      if (minify) code = (await terser.minify(code, { module: true, compress: true, mangle: true })).code;
      return Buffer.from(code);
    },
  };
}

// ---------------- measurement ----------------
const sizes = (buf) => ({ bytes: buf.length, gzip: gzipSync(buf, { level: 9 }).length, brotli: brotliCompressSync(buf).length });
const count = (text, needle) => text.split(needle).length - 1;
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 12);

const cases = [
  { id: 'pristine/A', tree: 'pristine', app: 'appA.js' },
  { id: 'patched/A', tree: 'patched', app: 'appA.js' },
  { id: 'patched/B', tree: 'patched', app: 'appB.js' },
  { id: 'pristine/C', tree: 'pristine', app: 'appC.js' },
  { id: 'patched/C', tree: 'patched', app: 'appC.js' },
  { id: 'patched/Cb', tree: 'patched', app: 'appCb.js' },
  { id: 'patched/D', tree: 'patched', app: 'appD.js' },
];
const data = {};
const markerLog = [];
for (const [bname, b] of Object.entries(bundlers)) {
  data[bname] = { label: b.label, cases: {} };
  const kernelCases = bname === 'vite' ? [{ id: 'pristine/Ak', tree: 'pristine', app: 'appAk.js', kernels: true }, { id: 'patched/Ak', tree: 'patched', app: 'appAk.js', kernels: true }, { id: 'patched/Bk', tree: 'patched', app: 'appBk.js', kernels: true }] : [];
  for (const c of [...cases, ...kernelCases]) {
    const raw = await b.run(dirs[c.tree], c.app, false, c);
    const min = await b.run(dirs[c.tree], c.app, true, c);
    const text = min.toString('utf8');
    const entry = { raw: raw.length, min: sizes(min), markers: {}, hookSites: {} };
    for (const m of MARKERS) { const n = count(text, m); if (n) entry.markers[m] = n; }
    for (const m of HOOK_SITES) { const n = count(text, `.${m}(`); if (n) entry.hookSites[m] = n; }
    entry.instrumentationProp = count(text, 'instrumentation');
    if (c.id === 'patched/A' || c.id === 'pristine/A') entry.determinism = sha(min) === sha(await b.run(dirs[c.tree], c.app, true, c)) ? 'identical on rebuild' : 'DIFFERS on rebuild';
    data[bname].cases[c.id] = entry;
    markerLog.push(`${bname.padEnd(8)} ${c.id.padEnd(12)} markers=${JSON.stringify(entry.markers)} hookSites=${JSON.stringify(entry.hookSites)} 'instrumentation'x${entry.instrumentationProp}`);
    console.log(`${bname} ${c.id} raw=${entry.raw} min=${entry.min.bytes} gz=${entry.min.gzip} br=${entry.min.brotli}`);
  }
}
writeFileSync(join(results, 'bundle-matrix.json'), JSON.stringify({ measured: new Date().toISOString(), node: process.version, data }, null, 2));
writeFileSync(join(results, 'bundle-markers.txt'), markerLog.join('\n') + '\n');

// ---------------- markdown ----------------
const fmt = (n) => String(n);
const delta = (a, b) => `${b - a >= 0 ? '+' : ''}${b - a}`;
let md = '';
md += '| bundler | case | raw | min | min+gzip-9 | min+brotli |\n|---|---|---:|---:|---:|---:|\n';
for (const [bn, bd] of Object.entries(data)) for (const [id, e] of Object.entries(bd.cases)) md += `| ${bn} | ${id} | ${e.raw} | ${e.min.bytes} | ${e.min.gzip} | ${e.min.brotli} |\n`;
md += '\nB1 residual for non-users = patched/A - pristine/A (and patched/C - pristine/C); B2 cost for users = patched/B - patched/A (and Cb - C)\n\n';
md += '| bundler | metric | B1 residual A | B1 residual C | B2 user cost B-A | B2 hub fixed cost Cb-C | unused import D-patched/C |\n|---|---|---:|---:|---:|---:|---:|\n';
for (const [bn, bd] of Object.entries(data)) {
  const c = bd.cases;
  for (const [metric, get] of [['raw', (e) => e.raw], ['min', (e) => e.min.bytes], ['gzip', (e) => e.min.gzip], ['brotli', (e) => e.min.brotli]]) {
    md += `| ${bn} | ${metric} | ${delta(get(c['pristine/A']), get(c['patched/A']))} | ${delta(get(c['pristine/C']), get(c['patched/C']))} | ${delta(get(c['patched/A']), get(c['patched/B']))} | ${delta(get(c['patched/C']), get(c['patched/Cb']))} | ${delta(get(c['patched/C']), get(c['patched/D']))} |\n`;
  }
}
if (data.vite.cases['patched/Ak']) {
  const c = data.vite.cases;
  md += `\nVite + unplugin ('use gpu' kernels, compute+render app): residual ${['raw', 'min.bytes', 'min.gzip', 'min.brotli'].map((k) => { const g = (e) => k.split('.').reduce((o, p) => o[p], e); return `${k}: ${delta(g(c['pristine/Ak']), g(c['patched/Ak']))}`; }).join(', ')}; user cost ${['raw', 'min.bytes', 'min.gzip', 'min.brotli'].map((k) => { const g = (e) => k.split('.').reduce((o, p) => o[p], e); return `${k}: ${delta(g(c['patched/Ak']), g(c['patched/Bk']))}`; }).join(', ')}\n`;
}
writeFileSync(join(results, 'bundle-matrix.md'), md);
console.log('\n' + md);
