# Politique de sécurité

## Signaler une vulnérabilité

Écrivez à **owesssalomon08@gmail.com** avec une description du problème et, si possible, les étapes pour le reproduire.
Merci de ne pas divulguer publiquement la faille avant correction. Une réponse est apportée sous 7 jours.

Les mêmes coordonnées sont publiées dans `/.well-known/security.txt` (RFC 9116).

## Mesures en place

Le site est **statique** (HTML, CSS, JavaScript natif) : pas de base de données, pas de serveur applicatif,
pas de formulaire ni de compte utilisateur, donc une surface d'attaque minimale.
La commande passe par WhatsApp / téléphone, aucune donnée personnelle ni de paiement n'est traitée sur le site.

| Couche | Mesure |
| --- | --- |
| Scripts et styles | **CSP stricte** : `default-src 'self'`, sans `unsafe-inline` ni `unsafe-eval`, aucun script ni style inline |
| Ressources | Tout est **auto-hébergé** (polices, images, JS) : aucun CDN tiers, aucun suivi, pas de requête Google Fonts |
| Transport | **HSTS** 2 ans avec `includeSubDomains` et `preload`, `upgrade-insecure-requests` |
| Clickjacking | `X-Frame-Options: DENY` et `frame-ancestors 'none'` |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| Fuite d'informations | `Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control: off` |
| API navigateur | `Permissions-Policy` : caméra, micro, géolocalisation, paiement, USB… désactivés |
| Isolation | `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `Origin-Agent-Cluster` |
| Liens externes | `rel="noopener noreferrer"` sur tout lien `target="_blank"` (anti tabnabbing) |
| Chaîne de livraison | **Zéro dépendance** npm en production, aucun framework : pas de paquet à compromettre |
| Contrôle automatique | `scripts/check.mjs` (hook pre-commit et build Vercel) : bloque script/style inline, ressource externe, lien cassé, secret en clair, en-tête manquant |
| Secrets | `.env` et clés ignorés par Git, détection de motifs de secrets avant chaque commit |

## Recommandations côté compte et hébergement

Ces mesures dépendent de vos comptes et ne peuvent pas être appliquées dans le code :

- Activer l'**authentification à deux facteurs** (2FA) sur Vercel, GitHub (si utilisé), Google Search Console et la boîte mail liée.
- Utiliser un **mot de passe unique et long** par service, géré par un gestionnaire de mots de passe.
- Sur Vercel : activer **Deployment Protection** pour les déploiements de prévisualisation, et limiter les membres de l'équipe.
- Avec un domaine personnalisé : activer **DNSSEC** et un enregistrement **CAA** chez le registrar, verrouiller le transfert du domaine.
- Tester la configuration après mise en ligne avec https://securityheaders.com et https://observatory.mozilla.org (objectif : A/A+).
- Soumettre le domaine à https://hstspreload.org uniquement quand HTTPS fonctionne sur le domaine et tous ses sous-domaines.
