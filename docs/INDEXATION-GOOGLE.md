# Mise en ligne et indexation Google

Objectif : que Neolia Chocolat apparaisse quand on cherche « Neolia », « chocolat noir Neolia », « chocolat noir non sucré Abidjan », etc.

Ce que le code fait déjà : balises `title`/`description` par page, URL canoniques, `sitemap.xml` et `robots.txt` générés,
données structurées JSON-LD (Organization, WebSite, Product, FAQPage, BreadcrumbList), Open Graph, images WebP légères
avec `alt`, HTML rendu sans JavaScript (lisible par Google), site rapide et mobile-first.

Ce qui dépend de vous (le code ne peut pas le faire) : les étapes ci-dessous.

## 1. Déployer sur Vercel (sans GitHub)

```bash
npm install -g vercel
vercel login          # connexion avec votre compte Vercel
vercel                # premier déploiement (prévisualisation)
vercel --prod         # mise en production
```

Vercel détecte `vercel.json` : il lance les contrôles de sécurité, le build, puis publie `dist/` avec les en-têtes de sécurité.
Si le build échoue, le message indique exactement la règle enfreinte.

## 2. Renseigner la vraie adresse du site

Dans `scripts/site.config.json`, remplacez `siteUrl` par l'adresse définitive (domaine Vercel ou domaine personnalisé,
par exemple `https://neolia-chocolat.com`), puis redéployez. Cette valeur alimente les canoniques, le sitemap,
robots.txt et les données structurées. **Sans cette étape, Google verra de fausses URL.**

Un nom de domaine propre (`.com`, `.ci`) est fortement recommandé pour la crédibilité et le référencement.
Vercel > Project > Settings > Domains permet de l'ajouter (HTTPS automatique).

## 3. Google Search Console

1. Aller sur https://search.google.com/search-console et ajouter la propriété (préférer « Domaine » avec une vérification DNS TXT, sinon « Préfixe d'URL »).
2. Vérifier la propriété.
3. Menu **Sitemaps** : soumettre `sitemap.xml`.
4. Menu **Inspection de l'URL** : coller l'adresse de l'accueil, puis **Demander une indexation**. Répéter pour `/produits` et `/decouvrir`.
5. Surveiller **Pages** (indexation) et **Résultats enrichis** (données structurées) pendant les semaines suivantes.

L'indexation prend de quelques jours à quelques semaines. Personne ne peut la garantir ni garantir une position (« première page »).
Une requête de marque comme « Neolia Chocolat » est la plus facile à gagner, car le nom est rare.

## 4. Accélérer la visibilité (hors code)

- **Fiche Google Business Profile** (Google Maps) pour Neolia à Abidjan : téléphone, horaires, photos, lien vers le site. C'est le levier local n° 1.
- Créer les pages **Facebook, Instagram, TikTok** (les icônes du pied de page pointent aujourd'hui vers « bientôt ») et y mettre le lien du site ; ajouter ensuite leurs URL dans `sameAs` de l'Organization (`src/pages/index.html`).
- Obtenir quelques **liens entrants** : annuaires ivoiriens, blogs gastronomie, partenaires, presse locale.
- Collecter de **vrais avis clients** et remplacer les témoignages d'exemple.
- Publier régulièrement du contenu utile (recettes, origine du cacao, conseils de dégustation) : ajouter des pages dans `src/pages/`.

## 5. Avant de lancer : contenus à compléter

`npm run check -- --strict` liste les contenus « à fournir » encore visibles (`data-placeholder`) :
descriptions des 5 étapes, histoire (année, fondateur), savoir-faire, formats, livraison, moyens de paiement,
témoignages d'exemple. Les remplacer par du vrai contenu avant la mise en ligne : Google valorise le contenu
original, et des textes provisoires nuisent à la crédibilité.

Pages légales manquantes : « Mentions légales », « Politique de confidentialité » et « Conditions d'utilisation »
pointent encore vers la page « bientôt ». À rédiger (avec un professionnel du droit si besoin) avant la promotion du site.
