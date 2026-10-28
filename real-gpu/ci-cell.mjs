#!/usr/bin/env node
// One cell of the CI browser matrix: runs the viability suite (and, for Chrome-family browsers driven over CDP, the
// 20-check real-device suite) against a PREBUILT page and writes a summary that never says more than was observed.
//
//   node real-gpu/ci-cell.mjs --cell chrome-linux --kind chrome --exe /usr/bin/google-chrome \
//        --prebuilt dist --chrome-arg=--no-sandbox ...
//   node real-gpu/ci-cell.mjs --cell firefox-windows --kind firefox --exe "C:/Program Files/Mozilla Firefox/firefox.exe" --prebuilt dist
//   node real-gpu/ci-cell.mjs --cell safari-macos --kind safari --prebuilt dist          (opens Safari via `open`)
//
// Writes real-gpu/results/ci/<cell>.json and <cell>-viability.json (<cell>-suite.json).
// Status: pass      every check passed
//         fail      at least one check failed, or the page threw
//         not-run   no WebGPU adapter in this browser on this runner (reported, never counted as a pass)
//         error     the browser did not start or the harness failed
// Exit code: 0 for pass and not-run, 1 for fail, 3 for error. "not-run" is visible in the summary table, not hidden.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const flag = (name) => args.includes(name);
const passthrough = (prefix) => args.filter((a) => a.startsWith(prefix));

const cell = option('--cell');
const kind = option('--kind');
const exe = option('--exe');
const prebuilt = resolve(option('--prebuilt') ?? '');
if (!cell || !kind || !['chrome', 'firefox', 'safari'].includes(kind)) {
  console.error('usage: ci-cell.mjs --cell <id> --kind chrome|firefox|safari [--exe <path>] --prebuilt <dist> [--chrome-arg=...]');
  process.exit(3);
}
if (!existsSync(join(prebuilt, 'index.html'))) {
  console.error(`No prebuilt page in ${prebuilt}`);
  process.exit(3);
}

// The same bytes everywhere: a digest of the served page so that results of different cells can be compared.
function digest(dir) {
  const hash = createHash('sha256');
  const walk = (d) =>
    readdirSync(d)
      .sort()
      .forEach((name) => {
        const full = join(d, name);
        if (statSync(full).isDirectory()) walk(full);
        else hash.update(name).update(readFileSync(full));
      });
  walk(prebuilt);
  return hash.digest('hex');
}

const outDir = join(here, 'results', 'ci');
mkdirSync(outDir, { recursive: true });

function runStep(name, command, commandArgs, outFile, timeoutMs) {
  console.log(`\n=== ${cell}: ${name}`);
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  let json = null;
  if (existsSync(outFile)) {
    try {
      json = JSON.parse(readFileSync(outFile, 'utf8'));
    } catch {
      json = null;
    }
  }
  return { status: result.status, signal: result.signal, stderr: (result.stderr ?? '').trim().split('\n').slice(-3).join(' | '), json };
}

const summary = { cell, kind, os: process.platform, arch: process.arch, node: process.version, pageDigest: digest(), when: new Date().toISOString(), steps: {} };
const viabilityOut = join(outDir, `${cell}-viability.json`);
const suiteOut = join(outDir, `${cell}-suite.json`);

if (kind === 'chrome') {
  const common = ['--prebuilt', prebuilt, '--allow-software', ...(exe ? ['--chrome', exe] : []), ...passthrough('--chrome-arg=')];
  const viability = runStep('viability (130 checks)', 'node', [join(here, 'run.mjs'), ...common, '--call', 'window.runViability()', '--out', viabilityOut], viabilityOut, 240_000);
  const suite = runStep('real-device suite (20 checks)', 'node', [join(here, 'run.mjs'), ...common, '--out', suiteOut], suiteOut, 240_000);
  summary.steps.viability = describeViability(viability, viabilityOut);
  summary.steps.suite = describeSuite(suite);
} else {
  const exeArgs = exe ? ['--exe', exe, ...(kind === 'firefox' ? ['--firefox'] : []), ...passthrough('--exe-arg=')] : [];
  const viability = runStep('viability', 'node', [join(here, 'browser-run.mjs'), '--browser', kind === 'firefox' ? 'Firefox' : 'Safari', ...exeArgs, '--prebuilt', prebuilt, '--call', 'window.runViability()', '--out', viabilityOut, '--timeout', '150'], viabilityOut, 240_000);
  summary.steps.viability = describeViability(viability, viabilityOut);
}

function countReport(report = []) {
  const lines = report.filter((l) => /^(PASS|FAIL)\s/.test(l));
  return { passed: lines.filter((l) => l.startsWith('PASS')).length, failed: lines.filter((l) => l.startsWith('FAIL')).length };
}

function describeViability(step, file) {
  const base = { exit: step.status, stderrTail: step.stderr };
  if (!step.json) return { ...base, status: step.status === 2 ? 'not-run' : 'error' };
  const env = step.json.environment ?? {};
  const prov = step.json.provenance ?? {};
  const counts = countReport(step.json.report);
  // exit codes: 0 ok, 1 checks failed, 2 no WebGPU (or software without --allow-software), 3 harness
  const status = prov.pageClassification === 'unavailable' ? 'not-run' : step.status === 0 ? 'pass' : step.status === 1 ? 'fail' : step.status === 2 ? 'not-run' : 'error';
  return {
    ...base,
    status,
    ...counts,
    skipped: step.json.skipped ?? [],
    classification: env.classification ?? 'page-only',
    browser: env.chrome ?? prov.userAgent ?? env.userAgent ?? null,
    adapter: { vendor: prov.vendor ?? null, architecture: prov.architecture ?? null, isFallbackAdapter: prov.isFallbackAdapter ?? null },
    file: file.slice(resolve(here, '..').length + 1),
  };
}

function describeSuite(step) {
  const base = { exit: step.status, stderrTail: step.stderr };
  if (!step.json) return { ...base, status: step.status === 2 ? 'not-run' : 'error' };
  const checks = step.json.checks ?? [];
  return {
    ...base,
    status: step.json.executionMode === 'unavailable' ? 'not-run' : step.status === 0 ? 'pass' : step.status === 1 ? 'fail' : step.status === 2 ? 'not-run' : 'error',
    passed: checks.filter((c) => c.pass).length,
    failed: checks.filter((c) => !c.pass).length,
    classification: step.json.executionMode,
  };
}

const statuses = Object.values(summary.steps).map((s) => s.status);
summary.status = statuses.includes('error') ? 'error' : statuses.includes('fail') ? 'fail' : statuses.every((s) => s === 'not-run') ? 'not-run' : statuses.includes('not-run') ? 'partial' : 'pass';
writeFileSync(join(outDir, `${cell}.json`), JSON.stringify(summary, null, 2) + '\n');
console.log(`\n=== ${cell}: ${summary.status}`);
console.log(JSON.stringify(summary.steps, null, 2));
process.exit(summary.status === 'fail' ? 1 : summary.status === 'error' ? 3 : 0);
