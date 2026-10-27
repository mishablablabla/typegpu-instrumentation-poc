#!/usr/bin/env node
// Real-device validation driver.
//
//   node real-gpu/run.mjs [--headed] [--chrome <path>] [--allow-software] [--chrome-arg=<flag> ...]
//   node real-gpu/run.mjs --example <scenario.ts> [--jsonl <out.jsonl>]   run YOUR scenario and print its instrumentation
//
// Builds the page from the patched TypeGPU checkout, serves it on 127.0.0.1, launches the locally installed
// Chrome with a throwaway profile, drives it over the DevTools protocol (Node's built-in WebSocket, no
// dependencies), runs the scenario, and writes real-gpu/results/<stamp>.json.
//
// Exit codes: 0 = validated on a hardware adapter; 1 = a check failed; 2 = NOT VALIDATED (no WebGPU,
// or only a software/fallback adapter without --allow-software); 3 = harness error (no browser, build failure).
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyExecution } from './classify.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const exampleArg = option('--example');
const jsonlArg = option('--jsonl');
const exampleMode = exampleArg !== undefined;
// Generic mode, used by the viability and overhead experiments:
//   --call <js expression>   evaluate it in the page instead of a fixed entry point; it must return
//                            { provenance, report?: string[], ok?: boolean, ... }
//   --out <file>             write the returned JSON (plus environment) there
//   --tree <checkout>        build from another TypeGPU checkout (e.g. the pristine baseline)
//   --page <dir>             page directory name under tests/instrumentation of that checkout
//   --dist <dir> --skip-build  reuse an already built page
//   --ready <js expression>  what to wait for before calling
const callExpr = option('--call');
const outArg = option('--out');
const pkg = option('--tree') ? join(resolve(option('--tree')), 'packages/typegpu') : join(root, '.work/typegpu/packages/typegpu');
const pageDir = join(pkg, 'tests/instrumentation', option('--page') ?? 'real-gpu-page');
const distDir = option('--dist') ? resolve(option('--dist')) : join(root, '.work/real-gpu-dist');
const readyExpr = option('--ready') ?? 'typeof window.runRealDeviceScenario === "function"';

function fail(code, message) {
  console.error(message);
  process.exit(code);
}

// --- locate Chrome ---
const chromeCandidates = [
  option('--chrome'),
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = chromeCandidates.find((p) => existsSync(p));
if (!chrome) {
  fail(3, `No Chrome/Chromium found (tried: ${chromeCandidates.join(', ')}). Set CHROME_PATH.`);
}

// --- build ---
if (!existsSync(pkg)) fail(3, 'Run scripts/setup.sh first.');
if (!option('--tree')) spawnSync(join(root, 'scripts/sync.sh'), { stdio: 'inherit' });
// The scenario must live inside the checkout so that `typegpu` resolves; single files only.
let examplePath = join(pkg, 'tests/instrumentation/examples/compute-scale.ts');
if (exampleMode) {
  const source = resolve(process.cwd(), exampleArg);
  if (!existsSync(source)) fail(3, `Scenario not found: ${source}`);
  examplePath = join(pageDir, 'user-example.ts');
  copyFileSync(source, examplePath);
}
if (!flag('--skip-build')) {
  const build = spawnSync('node', [join(pageDir, 'build.mjs'), distDir, examplePath], { cwd: pkg, stdio: 'inherit' });
  if (build.status !== 0) fail(3, 'Page build failed.');
}

// --- static server ---
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.map': 'application/json' };
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (path === '/favicon.ico') {
    res.writeHead(204).end();
    return;
  }
  const file = join(distDir, path === '/' ? 'index.html' : path);
  if (!file.startsWith(distDir) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  // Cross-origin isolation makes performance.now() fine-grained (about 5 us instead of 0.1 ms); the overhead
  // benchmark records the tick it actually got.
  res
    .writeHead(200, {
      'content-type': types[extname(file)] ?? 'application/octet-stream',
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-embedder-policy': 'require-corp',
    })
    .end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const url = `http://127.0.0.1:${server.address().port}/`;

// --- launch Chrome with a throwaway profile ---
const profile = mkdtempSync(join(tmpdir(), 'typegpu-instr-chrome-'));
const chromeArgs = [
  `--user-data-dir=${profile}`,
  '--remote-debugging-port=0',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  // lets the page call gc(), needed by the garbage-collection check
  '--js-flags=--expose-gc',
  ...(flag('--headed') ? [] : ['--headless=new']),
  ...args.filter((a) => a.startsWith('--chrome-arg=')).map((a) => a.slice('--chrome-arg='.length)),
  'about:blank',
];
const proc = spawn(chrome, chromeArgs, { stdio: 'ignore' });
const cleanup = () => {
  proc.kill();
  server.close();
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // Chrome may still be flushing its profile; the directory is in the OS temp folder.
  }
};
process.on('exit', cleanup);

async function waitFor(fn, what, timeoutMs = 20000) {
  const start = Date.now();
  for (;;) {
    const value = fn();
    if (value) return value;
    if (Date.now() - start > timeoutMs) fail(3, `Timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 100));
  }
}

const portFile = join(profile, 'DevToolsActivePort');
await waitFor(() => existsSync(portFile), 'Chrome DevTools port');
const [port, wsPath] = readFileSync(portFile, 'utf8').trim().split('\n');
const ws = new WebSocket(`ws://127.0.0.1:${port}${wsPath}`);
await new Promise((ok, no) => {
  ws.onopen = ok;
  ws.onerror = () => no(new Error('DevTools connection failed'));
});

let nextId = 1;
const pending = new Map();
const consoleLog = [];
let currentPhase = 'startup';
ws.onmessage = (message) => {
  const data = JSON.parse(message.data);
  if (data.id && pending.has(data.id)) {
    const { ok, no } = pending.get(data.id);
    pending.delete(data.id);
    data.error ? no(new Error(JSON.stringify(data.error))) : ok(data.result);
    return;
  }
  const params = data.params ?? {};
  let text;
  let level;
  if (data.method === 'Runtime.consoleAPICalled') {
    text = params.args?.map((a) => a.value ?? a.description ?? '').join(' ');
    level = params.type;
  } else if (data.method === 'Log.entryAdded') {
    text = params.entry.text;
    level = params.entry.level;
  }
  if (text === undefined) return;
  const marker = /^\[phase\] (.+)$/.exec(text);
  if (marker) currentPhase = marker[1];
  consoleLog.push({ phase: currentPhase, source: data.method === 'Log.entryAdded' ? 'browser-log' : 'page-console', level, text });
};
const send = (method, params = {}, sessionId) =>
  new Promise((ok, no) => {
    const id = nextId++;
    pending.set(id, { ok, no });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

const browserVersion = await send('Browser.getVersion');
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const page = (method, params) => send(method, params, sessionId);
await page('Runtime.enable');
await page('Log.enable');
await page('Page.enable');
await page('Page.navigate', { url });
await waitFor(async () => true, 'navigation');
// wait for the module script to register the entry point
let ready = false;
for (let i = 0; i < 100 && !ready; i++) {
  const r = await page('Runtime.evaluate', { expression: readyExpr, returnByValue: true });
  ready = r.result.value === true;
  if (!ready) await new Promise((r2) => setTimeout(r2, 100));
}
if (!ready) fail(3, `Page did not register the scenario. Console: ${JSON.stringify(consoleLog)}`);

const evaluation = await page('Runtime.evaluate', {
  expression: callExpr ?? (exampleMode ? 'window.runExample()' : 'window.runRealDeviceScenario()'),
  awaitPromise: true,
  returnByValue: true,
  timeout: 60000,
});
if (evaluation.exceptionDetails) {
  fail(3, `Scenario threw: ${JSON.stringify(evaluation.exceptionDetails, null, 2)}\nConsole: ${JSON.stringify(consoleLog, null, 2)}`);
}
const result = evaluation.result.value;
const gpuInfo = await send('SystemInfo.getInfo').catch(() => null);

// The page only knows what the adapter says about itself. The browser's GPU process is a second, independent source.
const gpuDevices = gpuInfo?.gpu?.devices ?? [];
const gpuStrings = gpuDevices.map((g) => `${g.vendorString} ${g.deviceString}`).join(' ');
const mode = classifyExecution({
  pageClassification: result.provenance.pageClassification,
  gpuProcessText: gpuStrings,
  gpuProcessDeviceCount: gpuDevices.length,
});
const validationLevel =
  mode === 'hardware-adapter'
    ? 'real-device: adapter reported non-fallback and the browser GPU process lists a hardware GPU'
    : mode === 'software'
      ? 'SOFTWARE ADAPTER - not real-GPU validation'
      : mode === 'unverified-adapter'
        ? 'UNVERIFIED - the adapter does not say whether it is a fallback; not counted as real-GPU validation'
        : 'NOT RUN - WebGPU unavailable';

if (callExpr) {
  const environment = {
    when: new Date().toISOString(),
    chrome: browserVersion.product,
    headless: !flag('--headed'),
    classification: mode,
    adapter: { vendor: result.provenance.vendor, architecture: result.provenance.architecture, isFallbackAdapter: result.provenance.isFallbackAdapter },
    gpuProcess: gpuStrings,
  };
  for (const line of result.report ?? []) console.log(line);
  console.log(`Run classification: ${validationLevel}`);
  if (outArg) {
    mkdirSync(dirname(resolve(outArg)), { recursive: true });
    writeFileSync(resolve(outArg), JSON.stringify({ environment, ...result }, null, 2) + '\n');
  }
  if (mode === 'unavailable') fail(2, 'NOT RUN: WebGPU is not available in this browser.');
  if ((mode === 'software' || mode === 'unverified-adapter') && !flag('--allow-software')) {
    fail(2, `NOT VALIDATED as real-GPU: ${validationLevel}.`);
  }
  if (result.ok === false) fail(1, 'The run reported failures.');
  process.exit(0);
}

if (exampleMode) {
  const REPORT_PREFIX = '[typegpu-instrumentation] ';
  console.log(`Scenario: ${exampleArg}`);
  console.log(`Chrome ${browserVersion.product} (${flag('--headed') ? 'headed' : 'headless'})`);
  console.log(`Adapter (from the page): ${result.provenance.vendor} / ${result.provenance.architecture}, isFallbackAdapter: ${result.provenance.isFallbackAdapter}`);
  console.log(`GPU process (from the browser): ${gpuStrings || 'no information'}`);
  console.log(`Run classification: ${validationLevel}\n`);
  for (const entry of consoleLog) {
    if (entry.text.startsWith('[phase]')) continue;
    if (entry.text.startsWith(REPORT_PREFIX)) console.log(entry.text.slice(REPORT_PREFIX.length));
    else if (entry.source === 'page-console') console.log(`[scenario] ${entry.text}`);
    else console.log(`[browser ${entry.level}] ${entry.text.split('\n')[0].slice(0, 200)}`);
  }

  if (jsonlArg && result.jsonl.length > 0) {
    const environment = JSON.stringify({
      record: 'environment',
      when: new Date().toISOString(),
      scenario: exampleArg,
      chrome: browserVersion.product,
      headless: !flag('--headed'),
      classification: mode,
      adapter: { vendor: result.provenance.vendor, architecture: result.provenance.architecture, isFallbackAdapter: result.provenance.isFallbackAdapter },
      gpuProcess: gpuStrings,
      note: 'cpu timestamps (t, resolveMs, createMs) are performance.now() milliseconds in the page; no GPU execution time is recorded',
    });
    const [header, ...rest] = result.jsonl;
    const target = resolve(process.cwd(), jsonlArg);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, [header, environment, ...rest].join('\n') + '\n');
    console.log(`\nJSONL written to ${target} (${rest.length + 2} lines)`);
  }

  if (mode === 'unavailable') fail(2, 'NOT RUN: WebGPU is not available in this browser.');
  if (result.error) fail(1, `The scenario threw: ${result.error}`);
  if ((mode === 'software' || mode === 'unverified-adapter') && !flag('--allow-software')) {
    fail(2, `NOT VALIDATED as real-GPU: ${validationLevel}. The output above is still what the scenario produced.`);
  }
  process.exit(0);
}

// --- summarise the browser's own output per phase ---
const browserOutput = {};
for (const entry of consoleLog) {
  if (entry.text.startsWith('[phase]')) continue;
  (browserOutput[entry.phase] ??= []).push(`${entry.source}/${entry.level}: ${entry.text.slice(0, 300)}`);
}
const withListener = (browserOutput['error-with-listener'] ?? []).length;
const withoutListener = (browserOutput['error-without-listener'] ?? []).length;
result.observations.push({
  id: 'console.rawValidationError',
  value: { withHubListener: withListener, afterHubDisposed: withoutListener, note: 'browser console/log entries during each phase' },
});

const record = {
  when: new Date().toISOString(),
  harness: { chrome: browserVersion.product, userAgent: browserVersion.userAgent, headless: !flag('--headed') },
  gpuProcess: gpuInfo?.gpu?.devices?.slice(0, 2).map((g) => ({ vendorId: g.vendorId, deviceId: g.deviceId, vendorString: g.vendorString, deviceString: g.deviceString, driverVersion: g.driverVersion })) ?? null,
  gpuFeatureStatus: gpuInfo?.gpu?.featureStatus ?? null,
  executionMode: mode,
  validationLevel,
  ...result,
  browserOutput,
};

mkdirSync(join(here, 'results'), { recursive: true });
const out = join(here, 'results', `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(out, JSON.stringify(record, null, 2) + '\n');

// --- report ---
console.log(`\nChrome ${browserVersion.product} (${record.harness.headless ? 'headless' : 'headed'})`);
console.log(`Adapter (from the page): ${result.provenance.vendor} / ${result.provenance.architecture}, isFallbackAdapter: ${result.provenance.isFallbackAdapter}`);
console.log(`GPU process (from the browser): ${gpuStrings || 'no information'}`);
console.log(`Validation level: ${record.validationLevel}\n`);
for (const c of result.checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.id}: ${c.description}`);
console.log('\nObservations:');
for (const o of result.observations) console.log(`  ${o.id}: ${JSON.stringify(o.value)}`);
console.log(`\nResult file: ${out}`);

const failed = result.checks.filter((c) => !c.pass);
if (mode === 'unavailable') fail(2, 'NOT VALIDATED: WebGPU is not available in this browser.');
if ((mode === 'software' || mode === 'unverified-adapter') && !flag('--allow-software')) {
  fail(2, `NOT VALIDATED: ${record.validationLevel}. Re-run with --allow-software for a smoke run that is not reported as real-GPU validation.`);
}
if (failed.length > 0) fail(1, `${failed.length} check(s) failed.`);
process.exit(0);
