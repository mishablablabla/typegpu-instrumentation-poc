#!/usr/bin/env node
// Runs a page entry point in ANY browser, no DevTools protocol or driver needed: the page is served from
// 127.0.0.1, the browser is opened on it with the OS `open` command, and the page posts its result back.
// Use it where run.mjs (Chrome over CDP) cannot: Safari, Firefox, another Chromium channel.
//
//   node real-gpu/browser-run.mjs --browser Safari --call 'window.runViability()' --out real-gpu/results/viability-safari.json
//   node real-gpu/browser-run.mjs --browser Safari --call 'window.runBench({...})' --page real-gpu-bench --dist <dist> --skip-build
//
// Options: --browser <macOS app name>  --exe <path to a browser binary> (instead of `open -a`; used on Windows/Linux and in CI)
//          --exe-arg=<arg> (repeatable)  --firefox (throwaway profile with WebGPU enabled, headless unless --headed)
//          --prebuilt <dist> (page built elsewhere: no checkout, no build)  --call <js>  --ready <js>  --out <file>  --tree/--page/--dist/--skip-build as run.mjs
//          --timeout <seconds> (default 180)
// There is only ONE source for "is this a real GPU": the page's own adapter information. Without the browser's
// GPU-process report the run is classified `page-only` and is never called two-source validated.
// The browser tab stays open afterwards (closing it would need automation permissions this script does not ask for).
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const browser = option('--browser') ?? 'Safari';
const callExpr = option('--call') ?? 'window.runViability()';
const readyExpr = option('--ready') ?? 'typeof window.runViability === "function"';
const outArg = option('--out');
const timeoutMs = Number(option('--timeout') ?? 180) * 1000;
const pkg = option('--tree') ? join(resolve(option('--tree')), 'packages/typegpu') : join(root, '.work/typegpu/packages/typegpu');
const pageDir = join(pkg, 'tests/instrumentation', option('--page') ?? 'real-gpu-page');
const prebuilt = option('--prebuilt');
const distDir = prebuilt ? resolve(prebuilt) : option('--dist') ? resolve(option('--dist')) : join(root, '.work/real-gpu-dist');

if (!flag('--skip-build') && !prebuilt) {
  if (!option('--tree')) spawnSync(join(root, 'scripts/sync.sh'), { stdio: 'inherit' });
  const examplePath = join(pkg, 'tests/instrumentation/examples/compute-scale.ts');
  const build = spawnSync('node', [join(pageDir, 'build.mjs'), distDir, examplePath], { cwd: pkg, stdio: 'inherit' });
  if (build.status !== 0) {
    console.error('Page build failed.');
    process.exit(3);
  }
}

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.map': 'application/json' };
const driverScript = (call, ready) => `
(async () => {
  const post = (kind, body) => fetch('/__' + kind, { method: 'POST', body: JSON.stringify(body) }).catch(() => {});
  try {
    for (let i = 0; i < 200 && !(${ready}); i++) await new Promise((r) => setTimeout(r, 100));
    if (!(${ready})) throw new Error('page entry point never appeared');
    const result = await (${call});
    await post('result', { ok: true, result, userAgent: navigator.userAgent, crossOriginIsolated: globalThis.crossOriginIsolated });
  } catch (error) {
    await post('result', { ok: false, error: String(error && error.stack || error), userAgent: navigator.userAgent });
  }
})();`;
let resolveResult;
const resultPromise = new Promise((ok) => (resolveResult = ok));
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (flag('--verbose')) console.error(`${req.method} ${path}`);
  if (req.method === 'POST' && path === '/__result') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      res.writeHead(204).end();
      resolveResult(JSON.parse(body));
    });
    return;
  }
  if (path === '/favicon.ico') return void res.writeHead(204).end();
  if (path === '/__driver.js') {
    return void res.writeHead(200, { 'content-type': 'text/javascript' }).end(driverScript(callExpr, readyExpr));
  }
  const file = join(distDir, path === '/' ? 'index.html' : path);
  if (!file.startsWith(distDir) || !existsSync(file)) return void res.writeHead(404).end();
  let body = readFileSync(file);
  if (path === '/') body = Buffer.from(body.toString().replace('</body>', '<script src="/__driver.js"></script></body>'));
  res
    .writeHead(200, {
      'content-type': types[extname(file)] ?? 'application/octet-stream',
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-embedder-policy': 'require-corp',
    })
    .end(body);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const url = `http://127.0.0.1:${server.address().port}/`;
console.error(`Serving ${distDir} at ${url}; opening ${browser}`);
const exe = option('--exe');
let profile;
let child;
if (exe) {
  const exeArgs = args.filter((a) => a.startsWith('--exe-arg=')).map((a) => a.slice('--exe-arg='.length));
  if (flag('--firefox')) {
    // WebGPU is behind a pref in Firefox; everything else here just keeps first-run UI and updates out of the way.
    profile = mkdtempSync(join(tmpdir(), 'typegpu-instr-firefox-'));
    const prefs = {
      'dom.webgpu.enabled': true,
      'gfx.webgpu.ignore-blocklist': true,
      'browser.shell.checkDefaultBrowser': false,
      'browser.startup.homepage_override.mstone': 'ignore',
      'datareporting.policy.dataSubmissionEnabled': false,
      'app.update.enabled': false,
      'dom.security.https_only_mode': false,
      'network.proxy.type': 0,
    };
    writeFileSync(join(profile, 'user.js'), Object.entries(prefs).map(([k, v]) => `user_pref(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('\n'));
    exeArgs.push('--no-remote', '--profile', profile, ...(flag('--headed') ? [] : ['--headless']));
  }
  child = spawn(exe, [...exeArgs, url], { stdio: 'ignore' });
  child.on('error', (error) => {
    console.error(`Could not start ${exe}: ${error.message}`);
    process.exit(3);
  });
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) console.error(`${exe} exited early with code ${code}`);
  });
} else {
  const opener = spawn('open', ['-a', browser, url], { stdio: 'inherit' });
  opener.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Could not open "${browser}" (open exited ${code}).`);
      process.exit(3);
    }
  });
}
process.on('exit', () => {
  child?.kill();
  if (profile) {
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // the browser may still be flushing its profile
    }
  }
});

const timer = setTimeout(() => {
  console.error(`Timed out after ${timeoutMs / 1000} s waiting for the page to report. Is WebGPU enabled in ${browser}?`);
  process.exit(3);
}, timeoutMs);
const payload = await resultPromise;
clearTimeout(timer);
server.close();

if (!payload.ok) {
  console.error(`The page threw: ${payload.error}`);
  process.exit(3);
}
const { result } = payload;
const environment = {
  when: new Date().toISOString(),
  browser,
  userAgent: payload.userAgent,
  crossOriginIsolated: payload.crossOriginIsolated,
  headless: false,
  classification: 'page-only',
  note: 'No browser-side GPU report is available without a driver; classification rests on the page\'s adapter info alone.',
  adapter: { vendor: result.provenance?.vendor, architecture: result.provenance?.architecture, isFallbackAdapter: result.provenance?.isFallbackAdapter },
};
for (const line of result.report ?? []) console.log(line);
console.log(`\n${browser}: ${payload.userAgent}`);
console.log(`Adapter (from the page): ${environment.adapter.vendor} / ${environment.adapter.architecture}, isFallbackAdapter: ${environment.adapter.isFallbackAdapter}`);
console.log(`Run classification: ${result.provenance?.pageClassification === 'unavailable' ? 'NOT RUN - WebGPU unavailable' : `page-only (${result.provenance?.pageClassification}); second source unavailable`}`);
if (outArg) {
  mkdirSync(dirname(resolve(outArg)), { recursive: true });
  writeFileSync(resolve(outArg), JSON.stringify({ environment, ...result }, null, 2) + '\n');
}
if (result.provenance?.pageClassification === 'unavailable') process.exit(2);
if (result.ok === false) process.exit(1);
process.exit(0);
