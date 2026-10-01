// Contrôles automatiques de sécurité, d'accessibilité de base et de SEO.
// Usage : node scripts/check.mjs            -> vérifie dist/ (après build)
//         node scripts/check.mjs --source   -> vérifie les sources (secrets, taille des fichiers)
//         node scripts/check.mjs --strict   -> les contenus « à fournir » deviennent bloquants
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const args = new Set(process.argv.slice(2));
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function walk(dir, skip = []) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (skip.includes(e.name)) return [];
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p, skip) : [p];
  });
}

// ---------- 1. Sources : secrets et fichiers volumineux ----------
const SECRET_PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, 'clé AWS'],
  [/gh[pousr]_[A-Za-z0-9]{30,}/, 'jeton GitHub'],
  [/sk-[A-Za-z0-9]{20,}/, 'clé API (sk-…)'],
  [/-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/, 'clé privée'],
  [/(?:password|passwd|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"\s]{8,}['"]/i, 'secret en clair'],
];

if (args.has('--source')) {
  const files = walk(ROOT, ['node_modules', '.git', 'dist', '.vercel', 'neolia-chocolat-mockups', 'images', 'logo']);
  for (const f of files) {
    const rel = relative(ROOT, f);
    if (statSync(f).size > 5 * 1024 * 1024) err(`${rel} : fichier > 5 Mo (optimiser l'image)`);
    if (/\.(webp|png|jpg|woff2)$/.test(f) || rel === 'scripts/check.mjs') continue;
    const txt = readFileSync(f, 'utf8');
    for (const [re, label] of SECRET_PATTERNS) if (re.test(txt)) err(`${rel} : ${label} détecté(e)`);
  }
  if (existsSync(join(ROOT, '.env'))) warn('.env présent localement (ignoré par Git, ne jamais le committer)');
}

// ---------- 2. vercel.json : en-têtes de sécurité obligatoires ----------
const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
const global = Object.fromEntries((vercel.headers.find((h) => h.source === '/(.*)')?.headers || []).map((h) => [h.key.toLowerCase(), h.value]));
for (const k of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'cross-origin-opener-policy', 'cross-origin-resource-policy']) {
  if (!global[k]) err(`vercel.json : en-tête ${k} manquant`);
}
const csp = global['content-security-policy'] || '';
if (/'unsafe-inline'|'unsafe-eval'/.test(csp)) err("CSP : 'unsafe-inline' / 'unsafe-eval' interdits");
if (!/frame-ancestors 'none'/.test(csp)) err("CSP : frame-ancestors 'none' requis (anti-clickjacking)");
if (!/object-src 'none'/.test(csp)) err("CSP : object-src 'none' requis");
if (/\*/.test(csp.replace(/'[^']*'/g, ''))) err('CSP : jokers (*) interdits');

if (args.has('--source')) report();

// ---------- 3. Pages générées ----------
if (!existsSync(DIST)) { err('dist/ introuvable : lancer « npm run build » avant'); report(); }
const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const distPath = (url) => {
  const clean = url.split('#')[0].split('?')[0];
  const base = join(DIST, clean);
  return [base, base + '.html', join(base, 'index.html')].find((p) => existsSync(p) && statSync(p).isFile());
};
let placeholders = 0;

for (const f of htmlFiles) {
  const rel = relative(DIST, f);
  const html = readFileSync(f, 'utf8');
  const noindex = /<meta name="robots" content="noindex/.test(html);

  // Sécurité : tout ce qui casserait une CSP stricte ou ouvrirait une faille XSS
  if (/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")/i.test(html)) err(`${rel} : script inline`);
  if (/<style[\s>]/i.test(html)) err(`${rel} : balise <style> inline`);
  if (/\sstyle="/i.test(html)) err(`${rel} : attribut style="" inline`);
  if (/\son[a-z]+\s*=\s*["']/i.test(html)) err(`${rel} : gestionnaire d'événement inline (onclick…)`);
  if (/javascript:/i.test(html)) err(`${rel} : URL javascript:`);
  if (/<(iframe|object|embed|form)[\s>]/i.test(html)) err(`${rel} : balise <iframe|object|embed|form> non prévue`);
  if (/\b(?:src|href)="http:\/\//i.test(html)) err(`${rel} : ressource en http:// (contenu mixte)`);
  for (const m of html.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)="(https?:\/\/[^"]+)"/gi)) {
    if (!/rel="(canonical|alternate)"/.test(m[0])) err(`${rel} : ressource externe chargée (${m[1]}) — tout doit être auto-hébergé`);
  }
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const tag = m[0];
    if (/target="_blank"/.test(tag) && !/rel="[^"]*noopener[^"]*"/.test(tag)) err(`${rel} : lien target=_blank sans rel="noopener" (${tag.slice(0, 80)})`);
  }

  // Liens internes et ressources locales
  for (const m of html.matchAll(/\b(?:href|src)="(\/[^"#?]*)/g)) {
    if (m[1] !== '/' && !distPath(m[1])) err(`${rel} : lien/ressource cassé ${m[1]}`);
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (!distPath(u)) err(`${rel} : srcset cassé ${u}`); }
  }

  // SEO / accessibilité de base
  if (!/<html lang="fr"/.test(html)) err(`${rel} : attribut lang manquant`);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] || '';
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '';
  if (!title) err(`${rel} : <title> manquant`); else if (title.length > 75) warn(`${rel} : title long (${title.length} car.)`);
  if (desc.length < 50 || desc.length > 175) warn(`${rel} : meta description de ${desc.length} caractères (idéal 70-160)`);
  if (!/<link rel="canonical"/.test(html)) err(`${rel} : canonical manquant`);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(`${rel} : ${h1} balises <h1> (1 attendue)`);
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt="/.test(m[0])) err(`${rel} : <img> sans alt`);
    if (!/\bwidth="/.test(m[0]) || !/\bheight="/.test(m[0])) err(`${rel} : <img> sans width/height (décalage de mise en page)`);
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { err(`${rel} : JSON-LD invalide`); }
  }
  if (!noindex && rel !== '404.html' && !/<script type="application\/ld\+json">/.test(html)) warn(`${rel} : aucune donnée structurée`);
  placeholders += (html.match(/data-placeholder/g) || []).length;
}

// Fichiers SEO
for (const f of ['robots.txt', 'sitemap.xml', 'site.webmanifest', '.well-known/security.txt']) if (!existsSync(join(DIST, f))) err(`dist/${f} manquant`);
if (existsSync(join(DIST, 'sitemap.xml')) && /bientot|404/.test(readFileSync(join(DIST, 'sitemap.xml'), 'utf8'))) err('sitemap.xml contient une page noindex');

if (placeholders) {
  const msg = `${placeholders} contenu(s) « à fournir » encore visibles (data-placeholder)`;
  args.has('--strict') ? err(msg) : warn(msg);
}

report();

function report() {
  warnings.forEach((w) => console.warn(`⚠  ${w}`));
  errors.forEach((e) => console.error(`✖  ${e}`));
  if (errors.length) { console.error(`\n${errors.length} erreur(s).`); process.exit(1); }
  if (!args.has('--source') || existsSync(DIST)) console.log(`✔ Contrôles OK (${warnings.length} avertissement(s))`);
  if (args.has('--source')) process.exit(0);
}
