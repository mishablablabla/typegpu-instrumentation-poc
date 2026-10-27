#!/usr/bin/env node
// Runs the two bundled scenarios on the real device through `run.mjs --example` and checks what comes out:
// the printed lines, and that the JSONL file parses and is internally consistent.
// Same exit codes as run.mjs: anything other than a hardware-adapter run is "not validated", never a pass.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'typegpu-instr-examples-'));
let failures = 0;
const expect = (ok, what) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`);
  if (!ok) failures++;
};

function run(example, mustPrint) {
  const jsonl = join(tmp, `${example}.jsonl`);
  const result = spawnSync('node', [join(root, 'real-gpu/run.mjs'), '--example', join(root, `examples/${example}.ts`), '--jsonl', jsonl], { encoding: 'utf8' });
  if (result.status === 2) {
    console.error(`NOT VALIDATED (exit 2): ${result.stderr.trim().split('\n').pop()}`);
    process.exit(2);
  }
  expect(result.status === 0, `${example}: exit code 0 (got ${result.status})`);
  for (const text of mustPrint) expect(result.stdout.includes(text), `${example}: prints "${text}"`);

  const records = readFileSync(jsonl, 'utf8').trimEnd().split('\n').map((l) => JSON.parse(l));
  expect(records[0].record === 'header' && records[0].format === 'typegpu-instrumentation-jsonl', `${example}: JSONL starts with the header`);
  expect(records[1].record === 'environment' && records[1].classification === 'hardware-adapter', `${example}: environment record says hardware-adapter`);
  const events = records.filter((r) => r.record === 'event').map((r) => r.event);
  expect(events.every((e, i) => e.seq === i + 1), `${example}: ${events.length} events, contiguous seq`);
  expect(records.filter((r) => r.record === 'snapshot').length === 1, `${example}: exactly one snapshot record`);
  // no GPU timing may appear anywhere
  expect(!/gpu(Time|Duration|Ms)\b/i.test(JSON.stringify(events)), `${example}: no GPU timing field in any event`);
  return events;
}

const compute = run('compute-scale', ['created [lazy]', 'result after x3: [3,6,9,12,15,18,21,24]', 'factor#', '2 writes, 8 B written', 'DEVICE LOST (destroyed)']);
expect(compute.some((e) => e.type === 'pipeline-created' && e.trigger === 'lazy'), 'compute-scale: a lazy pipeline-created event');
const broken = run('broken-shader', ['creation FAILED [initAsync]', 'shader: error at WGSL 1:51']);
expect(broken.some((e) => e.type === 'pipeline-creation-failed'), 'broken-shader: a pipeline-creation-failed event');

rmSync(tmp, { recursive: true, force: true });
console.log(failures === 0 ? '\nAll example checks passed on the hardware adapter.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
