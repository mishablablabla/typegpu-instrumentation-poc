#!/usr/bin/env node
// Serves dist/site/browser with the single-page-app fallback a static host needs for /instrumentation.
//   node tools/serve-dist.mjs [port]
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/site/browser');
const port = Number(process.argv[2] ?? 4400);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' };
createServer((req, res) => {
  const path = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = path.startsWith(root) && existsSync(path) && statSync(path).isFile() ? path : join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/instrumentation`));
