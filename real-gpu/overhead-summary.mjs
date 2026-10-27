// Usage: node real-gpu/overhead-summary.mjs real-gpu/results/overhead-<stamp>.jsonl
import { readFileSync } from 'node:fs';

const rows = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const median = (xs) => xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)];
const p95 = (xs) => xs.toSorted((a, b) => a - b)[Math.floor((xs.length - 1) * 0.95)];
const configs = ['pristine', 'pristine-b', 'disabled', 'enabled'];
const first = rows[0];
const perConfig = Object.fromEntries(configs.map((c) => [c, rows.filter((r) => r.config === c).length]));
console.log(`${first.environment.chrome}, ${first.environment.gpuProcess}`);
console.log(`${first.samples} samples per operation per process after ${first.warmupBatches} warm-up batches; processes per configuration: ${JSON.stringify(perConfig)}`);
console.log('CPU time of the JavaScript calls only (ns per operation); the queue is drained between samples, outside the timed region.\n');
console.log('| operation | config | median (ns/op) | p95 (ns/op) | median vs pristine | p95 vs pristine | process-median range |');
console.log('|---|---|---|---|---|---|---|');
for (const op of Object.keys(first.ops)) {
  const stat = (c) => {
    const mine = rows.filter((r) => r.config === c);
    const meds = mine.map((r) => r.ops[op].medianNs);
    const p95s = mine.map((r) => r.ops[op].p95Ns);
    // pooled view: all samples of all processes of this configuration
    const pooled = mine.flatMap((r) => r.ops[op].samplesNs);
    return { med: median(meds), p95: median(p95s), meds, pooledP95: p95(pooled), pooledMed: median(pooled) };
  };
  const base = stat('pristine');
  for (const c of configs) {
    const s = stat(c);
    const dm = c === 'pristine' ? '-' : `${(((s.med - base.med) / base.med) * 100).toFixed(1)} %`;
    const dp = c === 'pristine' ? '-' : `${(((s.p95 - base.p95) / base.p95) * 100).toFixed(1)} %`;
    console.log(`| ${op} | ${c} | ${s.med.toFixed(0)} | ${s.p95.toFixed(0)} | ${dm} | ${dp} | ${Math.min(...s.meds).toFixed(0)} - ${Math.max(...s.meds).toFixed(0)} |`);
  }
  const spread = ((Math.max(...base.meds) - Math.min(...base.meds)) / base.med) * 100;
  console.log(`| ${op} | (pristine process-to-process spread of medians) | | | ${spread.toFixed(1)} % | | |`);
}
