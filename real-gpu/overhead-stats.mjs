#!/usr/bin/env node
// Statistics for real-gpu/overhead.mjs output (JSON Lines). No dependencies.
//   node real-gpu/overhead-stats.mjs real-gpu/results/overhead2-<stamp>.jsonl [--json out.json]
//
// Protocol (why each choice):
// - The unit of replication is the fresh browser process. Per process and operation the statistic is the 10 %
//   trimmed mean of its batch samples (more resolution than a median, robust to the GC/outlier tail).
// - Processes are paired by BLOCK (every configuration ran once per block, in random order). Each contrast
//   is a per-block ratio test/base and difference test-base; the point estimate is the median of those, the
//   interval is a 10 000-resample bootstrap over blocks (seeded). Percentile interval, 95 %.
// - The A/A band is derived from the same-logic copies (pristine vs pristine-b, pristine-c vs pristine, ...):
//   the union of their intervals. An effect is "above noise" only if its interval excludes zero AND lies
//   outside the A/A band.
// - Hook cost is read from SAME-BUNDLE contrasts (enabled vs disabled), which carry no build-layout difference.
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : undefined;
const rows = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));

const sorted = (xs) => xs.toSorted((a, b) => a - b);
const median = (xs) => {
  const s = sorted(xs);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const trimmedMean = (xs, cut = 0.1) => {
  const s = sorted(xs);
  const k = Math.floor(s.length * cut);
  const kept = s.slice(k, s.length - k);
  return kept.reduce((a, b) => a + b, 0) / kept.length;
};
const quantile = (xs, q) => sorted(xs)[Math.floor((xs.length - 1) * q)];

let seed = 20261027;
const rand = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const BOOT = 10_000;
function bootstrap(n, stat) {
  const results = [];
  for (let i = 0; i < BOOT; i++) {
    const idx = Array.from({ length: n }, () => Math.floor(rand() * n));
    results.push(stat(idx));
  }
  const s = sorted(results);
  return { lo: s[Math.floor(BOOT * 0.025)], hi: s[Math.floor(BOOT * 0.975)] };
}

const configs = [...new Set(rows.map((r) => r.config))];
const blocks = [...new Set(rows.map((r) => r.block))].sort((a, b) => a - b);
const ops = Object.keys(rows[0].ops);
const byKey = new Map(rows.map((r) => [`${r.config}#${r.block}`, r]));

// Processes whose CPU-speed probe is far from the typical one were disturbed by something else on the machine.
const probes = rows.map((r) => (r.calibrationNs.before + r.calibrationNs.after) / 2);
const typicalProbe = median(probes);
const disturbed = new Set(
  rows.filter((r, i) => Math.abs(probes[i] / typicalProbe - 1) > 0.25).map((r) => `${r.config}#${r.block}`),
);

const first = rows[0];
const lines = [];
const print = (s = '') => {
  lines.push(s);
  console.log(s);
};
print(`# ${file}`);
print(`${first.provenance.userAgent}`);
print(`GPU: ${first.provenance.vendor} / ${first.provenance.architecture}; crossOriginIsolated=${first.timer.crossOriginIsolated}, timer tick ${first.timer.tickMs} ms`);
print(`blocks: ${blocks.length}; configs: ${configs.join(', ')}; samples per op per process: ${first.samples}; processes: ${rows.length}`);
print(`CPU-speed probe: median ${typicalProbe.toFixed(3)} ns/iteration; ${disturbed.size} process(es) deviate by more than 25 % (listed in the JSON; the tables below use all processes, sensitivity in the last section).`);
print('Costs are CPU time of the JavaScript calls only. No GPU time is measured or claimed.');
print();

const statOf = (config, block, op) => {
  const row = byKey.get(`${config}#${block}`);
  return row ? trimmedMean(row.ops[op].samplesNs) : undefined;
};

function contrast(base, test, op, usableBlocks) {
  const pairs = usableBlocks
    .map((b) => [statOf(base, b, op), statOf(test, b, op)])
    .filter(([a, b]) => a !== undefined && b !== undefined);
  if (pairs.length < 4) return undefined;
  const ratio = (idx) => median(idx.map((i) => pairs[i][1] / pairs[i][0]));
  const diff = (idx) => median(idx.map((i) => pairs[i][1] - pairs[i][0]));
  const all = pairs.map((_, i) => i);
  return {
    n: pairs.length,
    baseNs: median(pairs.map((p) => p[0])),
    ratio: ratio(all) - 1,
    ratioCI: (({ lo, hi }) => ({ lo: lo - 1, hi: hi - 1 }))(bootstrap(pairs.length, ratio)),
    diffNs: diff(all),
    diffCI: bootstrap(pairs.length, diff),
  };
}

const pct = (x) => `${(x * 100).toFixed(1)} %`;
const ns = (x) => `${x.toFixed(1)} ns`;

const aaPairs = [
  ['pristine', 'pristine-b'],
  ['pristine', 'pristine-c'],
  ['pristine-b', 'pristine-c'],
].filter(([a, b]) => configs.includes(a) && configs.includes(b));
const contrasts = [
  ['pristine', 'disabled', 'structure: patched-but-disabled vs unpatched (includes the restructured unwrap/initSync and layout)'],
  ['disabled', 'enabled-h0', 'hook + counters, no history, no subscriber'],
  ['disabled', 'enabled', 'hook + counters + history (default), no subscriber'],
  ['enabled', 'enabled-noop', 'adding one no-op subscriber'],
  ['enabled-noop', 'enabled-console', 'console reporter (to a counting stub) instead of no-op'],
  ['enabled-noop', 'enabled-jsonl', 'JSONL exporter (in memory) instead of no-op'],
].filter(([a, b]) => configs.includes(a) && configs.includes(b));

function report(title, usableBlocks) {
  print(`## ${title}`);
  print();
  const summary = {};
  for (const op of ops) {
    const kind = first.ops[op].kind;
    print(`### ${op} (${kind})`);
    print();
    // absolute numbers
    print('| config | median of process trimmed-means | IQR across processes | median of per-process p95 |');
    print('|---|---|---|---|');
    for (const c of configs) {
      const procs = rows.filter((r) => r.config === c && usableBlocks.includes(r.block));
      const means = procs.map((r) => trimmedMean(r.ops[op].samplesNs));
      const p95s = procs.map((r) => r.ops[op].p95Ns);
      print(`| ${c} | ${ns(median(means))} | ${ns(quantile(means, 0.25))} .. ${ns(quantile(means, 0.75))} | ${ns(median(p95s))} |`);
    }
    print();

    const aa = aaPairs.map(([a, b]) => contrast(a, b, op, usableBlocks)).filter(Boolean);
    const bandLo = aa.length ? Math.min(...aa.map((c) => c.ratioCI.lo)) : 0;
    const bandHi = aa.length ? Math.max(...aa.map((c) => c.ratioCI.hi)) : 0;
    const bandNsLo = aa.length ? Math.min(...aa.map((c) => c.diffCI.lo)) : 0;
    const bandNsHi = aa.length ? Math.max(...aa.map((c) => c.diffCI.hi)) : 0;
    print(`A/A band (same logic, rebuilt or twin processes): ratio ${pct(bandLo)} .. ${pct(bandHi)}, ${ns(bandNsLo)} .. ${ns(bandNsHi)}`);
    print();
    print('| contrast (base → test) | effect | 95 % CI | Δ ns/call | 95 % CI (ns) | blocks | verdict |');
    print('|---|---|---|---|---|---|---|');
    for (const [a, b] of aaPairs) {
      const c = contrast(a, b, op, usableBlocks);
      if (c) print(`| A/A: ${a} → ${b} | ${pct(c.ratio)} | ${pct(c.ratioCI.lo)} .. ${pct(c.ratioCI.hi)} | ${ns(c.diffNs)} | ${ns(c.diffCI.lo)} .. ${ns(c.diffCI.hi)} | ${c.n} | noise reference |`);
    }
    for (const [a, b, what] of contrasts) {
      const c = contrast(a, b, op, usableBlocks);
      if (!c) continue;
      const excludesZero = c.diffCI.lo > 0 || c.diffCI.hi < 0;
      const outsideBand = c.diffCI.lo > bandNsHi || c.diffCI.hi < bandNsLo;
      const verdict = excludesZero && outsideBand ? 'above noise' : excludesZero ? 'inside the A/A band (not separable from bias)' : 'uncertain (CI includes 0)';
      (summary[op] ??= {})[`${a}->${b}`] = { ...c, verdict, band: { ratioLo: bandLo, ratioHi: bandHi, nsLo: bandNsLo, nsHi: bandNsHi } };
      print(`| ${a} → ${b}: ${what} | ${pct(c.ratio)} | ${pct(c.ratioCI.lo)} .. ${pct(c.ratioCI.hi)} | ${ns(c.diffNs)} | ${ns(c.diffCI.lo)} .. ${ns(c.diffCI.hi)} | ${c.n} | ${verdict} |`);
    }
    print();
  }
  return summary;
}

const summaryAll = report('All processes', blocks);
const keepBlocks = blocks.filter((b) => configs.every((c) => !disturbed.has(`${c}#${b}`)));
let summaryClean;
if (disturbed.size > 0 && keepBlocks.length >= 4) {
  summaryClean = report(`Sensitivity: blocks without any CPU-probe-disturbed process (${keepBlocks.length} of ${blocks.length})`, keepBlocks);
}

// Tail and heap observations
print('## Tails and heap');
print();
print('| op | config | share of samples > 3x the process median | median heap growth over the samples (MiB) |');
print('|---|---|---|---|');
for (const op of ops) {
  for (const c of configs) {
    const procs = rows.filter((r) => r.config === c);
    const tails = procs.map((r) => {
      const m = median(r.ops[op].samplesNs);
      return r.ops[op].samplesNs.filter((x) => x > 3 * m).length / r.ops[op].samplesNs.length;
    });
    const growth = procs
      .map((r) => (r.ops[op].heapAfter !== null && r.ops[op].heapBefore !== null ? (r.ops[op].heapAfter - r.ops[op].heapBefore) / 2 ** 20 : null))
      .filter((x) => x !== null);
    print(`| ${op} | ${c} | ${pct(median(tails))} | ${growth.length ? median(growth).toFixed(2) : 'n/a'} |`);
  }
}
print();

if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify({ file, typicalProbe, disturbed: [...disturbed], summaryAll, summaryClean }, null, 1));
}
writeFileSync(file.replace(/\.jsonl$/, '.stats.md'), lines.join('\n') + '\n');
