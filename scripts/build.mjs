// Générateur de site statique sans dépendance : src/ -> dist/
// Usage : node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const cfg = JSON.parse(readFileSync(join(ROOT, 'scripts/site.config.json'), 'utf8'));
const imgManifest = JSON.parse(readFileSync(join(SRC, 'assets/img/manifest.json'), 'utf8'));
const read = (p) => readFileSync(join(SRC, p), 'utf8');

const wa = (msg) => `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(msg)}`;
const vars = {
  SITE_URL: cfg.siteUrl.replace(/\/$/, ''),
  SITE_NAME: cfg.siteName,
  TEL: `tel:${cfg.phoneTel}`,
  PHONE: cfg.phoneDisplay,
  WA_NUMBER_DISPLAY: cfg.whatsappDisplay,
  WA_BASE: `https://wa.me/${cfg.whatsappNumber}`,
  WA_INFO: wa(cfg.messages.info),
  WA_SUCRE: wa(cfg.messages.sucre),
  WA_NONSUCRE: wa(cfg.messages.nonSucre),
  MSG_SUCRE: cfg.messages.sucre,
  MSG_NONSUCRE: cfg.messages.nonSucre,
  YEAR: String(new Date().getFullYear()),
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fill = (s) => s.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));

// <x-img name="hero" alt="..." sizes="100vw" class="..." eager></x-img>  ->  <img srcset ...>
function renderImages(html) {
  return html.replace(/<x-img\s+([^>]*?)>\s*<\/x-img>/g, (_, attrs) => {
    const a = {};
    attrs.replace(/([\w-]+)(?:="([^"]*)")?/g, (m, k, v) => { a[k] = v ?? true; return m; });
    const meta = imgManifest[a.name];
    if (!meta) throw new Error(`Image inconnue : ${a.name}`);
    const widths = meta.widths;
    const max = widths[widths.length - 1];
    const [rw, rh] = meta.ratio;
    const srcset = widths.map((w) => `/assets/img/${a.name}-${w}.webp ${w}w`).join(', ');
    const eager = a.eager === true;
    return `<img src="/assets/img/${a.name}-${max}.webp" srcset="${srcset}" sizes="${a.sizes || '100vw'}" width="${rw}" height="${rh}" alt="${esc(a.alt ?? '')}"${a.class ? ` class="${a.class}"` : ''} decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
  });
}

function parsePage(file) {
  const raw = read(`pages/${file}`);
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Métadonnées manquantes : ${file}`);
  return { meta: JSON.parse(fill(m[1])), body: raw.slice(m[0].length) };
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true, filter: (p) => !p.endsWith('manifest.json') || !p.includes('/img/') });
if (existsSync(join(SRC, 'static'))) cpSync(join(SRC, 'static'), DIST, { recursive: true });

const layout = read('partials/layout.html');
const nav = read('partials/nav.html');
const footer = read('partials/footer.html');
const pages = readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'));
const indexable = [];

for (const file of pages) {
  const { meta, body } = parsePage(file);
  const path = meta.path; // ex. "/", "/produits"
  const canonical = vars.SITE_URL + (path === '/' ? '/' : path);
  const noindex = meta.robots === 'noindex';
  const navHtml = nav.replace(/ data-nav="(\w+)"/g, (_, k) => (k === meta.active ? ' aria-current="page"' : ''));
  const ld = (meta.jsonld || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const ogImage = `${vars.SITE_URL}/assets/img/og-image.jpg`;
  let html = layout
    .replace('{{TITLE}}', esc(meta.title))
    .replace('{{DESCRIPTION}}', esc(meta.description))
    .replace('{{KEYWORDS}}', esc(meta.keywords || ''))
    .replace(/\{\{CANONICAL\}\}/g, canonical)
    .replace('{{ROBOTS}}', robots)
    .replace(/\{\{OG_IMAGE\}\}/g, ogImage)
    .replace('{{OG_TYPE}}', meta.ogType || 'website')
    .replace('{{PRELOAD}}', meta.preload ? `<link rel="preload" as="image" href="${meta.preload.href}" imagesrcset="${meta.preload.srcset}" imagesizes="100vw" fetchpriority="high">` : '')
    .replace('{{JSONLD}}', ld)
    .replace('{{BODY_CLASS}}', meta.bodyClass || '')
    .replace('{{NAV}}', navHtml)
    .replace('{{FOOTER}}', footer)
    .replace('{{SCRIPTS}}', (meta.scripts || []).map((s) => `<script src="/assets/js/${s}" defer></script>`).join('\n'))
    .replace('{{CONTENT}}', body);
  html = fill(renderImages(html));
  const out = file === 'index.html' ? 'index.html' : file === '404.html' ? '404.html' : join(file.replace('.html', ''), 'index.html');
  mkdirSync(dirname(join(DIST, out)), { recursive: true });
  writeFileSync(join(DIST, out), html);
  if (!noindex && file !== '404.html') indexable.push({ canonical, changefreq: meta.changefreq || 'monthly', priority: meta.priority || '0.5' });
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((u) => `  <url>\n    <loc>${u.canonical}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /bientot\n\nSitemap: ${vars.SITE_URL}/sitemap.xml\n`);
console.log(`✔ ${pages.length} pages générées dans dist/ (${indexable.length} indexables)`);
