#!/usr/bin/env node
// Checks that every relative link in the repository's Markdown (README.md and docs/*.md) resolves to a file, and
// that `#anchor` fragments match a heading of the target (GitHub's slug rules, approximated). External links are not fetched.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['README.md', ...readdirSync(join(root, 'docs')).filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`)];

const slug = (heading) =>
  heading
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
const headingsOf = (path) => {
  const text = readFileSync(path, 'utf8').replace(/```[\s\S]*?```/g, '');
  return new Set([...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1])));
};

let checked = 0;
const bad = [];
for (const file of files) {
  const abs = join(root, file);
  const text = readFileSync(abs, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^(https?:|mailto:)/.test(href)) continue;
    const [pathPart, fragment] = href.split('#');
    const target = pathPart ? resolve(dirname(abs), pathPart) : abs;
    checked++;
    if (!existsSync(target)) {
      bad.push(`${file}: missing file ${href}`);
      continue;
    }
    if (fragment && target.endsWith('.md') && !headingsOf(target).has(fragment)) {
      bad.push(`${file}: no heading "${fragment}" in ${pathPart || file}`);
    }
  }
}
console.log(`${files.length} files, ${checked} relative links checked`);
if (bad.length) {
  console.error(bad.join('\n'));
  process.exit(1);
}
console.log('all relative links resolve');
