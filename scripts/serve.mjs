// Serveur de prévisualisation local (dist/ -> http://localhost:4173), sans dépendance.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const vercel = JSON.parse(readFileSync(join(DIST, '..', 'vercel.json'), 'utf8'));
const secHeaders = Object.fromEntries((vercel.headers?.find((h) => h.source === '/(.*)')?.headers || []).map((h) => [h.key, h.value]));

createServer((req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, p);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  else if (!existsSync(file) && existsSync(file + '.html')) file += '.html';
  const found = existsSync(file) && file.startsWith(DIST);
  if (!found) file = join(DIST, '404.html');
  res.writeHead(found ? 200 : 404, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', ...secHeaders });
  res.end(readFileSync(file));
}).listen(4173, () => console.log('Prévisualisation : http://localhost:4173'));
