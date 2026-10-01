# Neolia Chocolat

Site vitrine de **Neolia Chocolat**, marque ivoirienne de chocolat noir (sucré et non sucré), Abidjan, Côte d'Ivoire.
Implémentation de la maquette Claude Design « Neolia Chocolat – Prototype » : site statique, rapide, sécurisé et optimisé pour Google.

## Stack

HTML / CSS / JavaScript natif, **sans framework ni dépendance**. Un petit générateur Node (`scripts/build.mjs`) assemble les pages
à partir de gabarits (`src/`) vers `dist/`. Hébergement prévu : **Vercel**.

## Démarrage

Prérequis : Node.js 20 ou plus.

```bash
npm run build      # génère dist/ (pages, sitemap.xml, robots.txt, security.txt)
npm run check      # contrôles sécurité / SEO / liens sur dist/
npm run preview    # build + serveur local sur http://localhost:4173 (avec les en-têtes de sécurité)
npm run hooks      # active le hook pre-commit (à faire une fois après le clonage)
```

## Structure

```
src/
  pages/          index, produits, decouvrir, bientot, 404 (métadonnées SEO + JSON-LD en tête de fichier)
  partials/       layout.html, nav.html, footer.html
  assets/
    css/          fonts, base (tokens), layout, components, pages
    js/           nav.js (menu mobile), products.js (filtres, commande WhatsApp)
    img/          images WebP responsives, icônes, image Open Graph
    fonts/        polices WOFF2 auto-hébergées (licence OFL)
  static/         site.webmanifest
scripts/          build.mjs, check.mjs, serve.mjs, site.config.json
vercel.json       en-têtes de sécurité, cache, URLs propres, commande de build
docs/             INDEXATION-GOOGLE.md
```

Les coordonnées, l'adresse du site et les messages WhatsApp se modifient dans `scripts/site.config.json`.
Les images originales et les maquettes Claude Design restent hors dépôt (`.gitignore`).

## Sécurité

Voir [SECURITY.md](SECURITY.md) : CSP stricte (aucun script/style inline, tout auto-hébergé), HSTS preload, anti-clickjacking,
Permissions-Policy, isolation cross-origin, contrôles automatiques à chaque commit et à chaque déploiement.

## Mise en ligne et référencement

Voir [docs/INDEXATION-GOOGLE.md](docs/INDEXATION-GOOGLE.md) : déploiement Vercel, Search Console, sitemap, visibilité locale.

## Conventions de commit

[Conventional Commits](https://www.conventionalcommits.org/fr/) : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `chore`,
avec une portée (`feat(produits): …`), un titre à l'impératif de 72 caractères maximum et un corps expliquant le pourquoi.
Branche principale : `main`.

## À compléter avant le lancement

Les contenus marqués `data-placeholder` (descriptions des étapes, histoire, formats, livraison, paiement, témoignages réels)
et les pages légales. `npm run check -- --strict` bloque tant qu'il en reste.
