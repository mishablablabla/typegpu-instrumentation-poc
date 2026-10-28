#!/usr/bin/env node
// Renders the results of the CI browser/platform matrix as a Markdown table (for $GITHUB_STEP_SUMMARY and docs).
// Reads every JSON file under the given directory: mock-*.json (node tests per OS) and <cell>.json (browser cells).
// It states what was observed and nothing else: a cell with no WebGPU adapter is "not run", never "pass".
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? 'ci-results');
const outFile = process.argv[3];
const files = [];
const walk = (d) => {
  if (!existsSync(d)) return;
  for (const name of readdirSync(d)) {
    const full = join(d, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.json') && !/-(viability|suite)\.json$/.test(name)) files.push(full);
  }
};
walk(dir);
const records = files.map((f) => JSON.parse(readFileSync(f, 'utf8')));

const lines = [];
const mocks = records.filter((r) => r.kind === 'mock').sort((a, b) => a.os.localeCompare(b.os));
lines.push('### Mock-device tests, type check, lint (Node)', '', '| OS | Node | Result |', '|---|---|---|');
for (const m of mocks) lines.push(`| ${m.os} | ${m.node} | ${m.status} |`);
if (mocks.length === 0) lines.push('| (no results found) | | |');

const cells = records.filter((r) => r.kind !== 'mock' && r.cell).sort((a, b) => a.cell.localeCompare(b.cell));
lines.push('', '### Real browsers (same built page everywhere)', '', '| Cell | Browser | Adapter | Classification | Viability | Real-device suite | Status |', '|---|---|---|---|---|---|---|');
const counts = (s) => (s?.passed === undefined ? (s?.status ?? 'n/a') : `${s.passed}/${s.passed + s.failed}${s.skipped?.length ? ` (+${s.skipped.length} skipped)` : ''}`);
for (const c of cells) {
  const v = c.steps?.viability ?? {};
  const adapter = v.adapter?.isFallbackAdapter === null || v.adapter?.isFallbackAdapter === undefined ? 'none' : `${v.adapter.vendor || 'info hidden'}${v.adapter.architecture ? '/' + v.adapter.architecture : ''}${v.adapter.isFallbackAdapter ? ' (fallback)' : ''}`;
  lines.push(`| ${c.cell} | ${String(v.browser ?? 'n/a').replace(/Mozilla.*?(Firefox\/[\d.]+|Chrome\/[\d.]+|Version\/[\d.]+ Safari)/, '$1').slice(0, 60)} | ${adapter} | ${v.classification ?? 'n/a'} | ${counts(v)} | ${c.steps?.suite ? counts(c.steps.suite) : 'not applicable'} | **${c.status}** |`);
}
if (cells.length === 0) lines.push('| (no results found) | | | | | | |');
const digests = [...new Set(cells.map((c) => c.pageDigest))];
lines.push('', `Page digest(s): ${digests.map((d) => `\`${d.slice(0, 12)}\``).join(', ') || 'n/a'}${digests.length === 1 ? ' (one page, byte-identical in every cell)' : ''}`);
lines.push('', '`not-run` means the browser had no WebGPU adapter on that runner; it is not a pass. `software`/`page-only` classifications are not real-GPU validation.');
const text = lines.join('\n') + '\n';
console.log(text);
if (outFile) writeFileSync(outFile, text);
