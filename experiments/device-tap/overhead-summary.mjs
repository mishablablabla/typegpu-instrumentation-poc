// node alt/overhead-summary.mjs alt/results/overhead-<stamp>.jsonl
import { readFileSync } from 'node:fs';
const rows = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const median = (xs) => xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)];
const q95 = (xs) => xs.toSorted((a, b) => a - b)[Math.floor((xs.length - 1) * 0.95)];
const first = rows[0];
const cfgs = Object.keys(Object.values(first.ops)[0]);
console.log(`${rows.length} fresh Chrome processes; ${first.environment.chrome}; ${first.environment.gpuProcess}; ${first.samples} samples/op/config/process`);
console.log('| operation | config | median ns/op | p95 ns/op | median vs plain | (range of per-process medians) |');
console.log('|---|---|---|---|---|---|');
for (const op of Object.keys(first.ops)) {
  const stat = (c) => {
    const meds = rows.map((r) => r.ops[op][c].medianNs);
    const p95s = rows.map((r) => r.ops[op][c].p95Ns);
    return { med: median(meds), p95: median(p95s), meds };
  };
  const base = stat('plain');
  for (const c of cfgs) {
    const s = stat(c);
    const rel = c === 'plain' ? '-' : `${base.med > 0 ? (s.med / base.med).toFixed(2) + 'x' : 'n/a'} (${s.med - base.med >= 0 ? '+' : ''}${(s.med - base.med).toFixed(0)} ns)`;
    console.log(`| ${op} | ${c} | ${s.med.toFixed(0)} | ${s.p95.toFixed(0)} | ${rel} | ${Math.min(...s.meds).toFixed(0)}-${Math.max(...s.meds).toFixed(0)} |`);
  }
}
