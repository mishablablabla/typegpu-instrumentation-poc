// Usage: node bench/summarize.mjs bench/results/<file>.jsonl
import { readFileSync } from 'node:fs';

const rows = readFileSync(process.argv[2], 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const configs = ['pristine', 'pristine-b', 'disabled', 'enabled'].filter((c) =>
  rows.some((r) => r.config === c),
);
const ops = Object.keys(rows[0].ops);

const first = rows[0];
console.log(
  `node ${first.node}, ${first.platform}, ${first.samples} samples x ${first.batch} calls per process, ${rows.filter((r) => r.config === 'pristine').length} processes per configuration\n`,
);
console.log(
  '| operation | config | median of process medians (ns/op) | process-median range (ns/op) | vs pristine | minor GCs / 200k ops (median) |',
);
console.log('|---|---|---|---|---|---|');
for (const op of ops) {
  const base = median(
    rows.filter((r) => r.config === 'pristine').map((r) => r.ops[op].medianNsPerOp),
  );
  const baseRange = rows.filter((r) => r.config === 'pristine').map((r) => r.ops[op].medianNsPerOp);
  for (const config of configs) {
    const mine = rows.filter((r) => r.config === config);
    const med = mine.map((r) => r.ops[op].medianNsPerOp);
    const m = median(med);
    const delta = config === 'pristine' ? '-' : `${(((m - base) / base) * 100).toFixed(1)} %`;
    const gcs = median(mine.map((r) => r.ops[op].minorGcsPer200kOps));
    console.log(
      `| ${op} | ${config} | ${m.toFixed(1)} | ${Math.min(...med).toFixed(1)} - ${Math.max(...med).toFixed(1)} | ${delta} | ${gcs} |`,
    );
  }
  const spread = ((Math.max(...baseRange) - Math.min(...baseRange)) / base) * 100;
  console.log(`| ${op} | (pristine run-to-run spread) | | | ${spread.toFixed(1)} % | |`);
}
const enabled = rows.filter((r) => r.config === 'enabled');
console.log(
  '\nEvents during the whole enabled run (all hot-path work included):',
  JSON.stringify(enabled[0].instrumentation),
);
