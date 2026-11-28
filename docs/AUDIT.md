# Audit général — Aqoon UNEFD (ex-SmartEdu ERP)

Date : 26 novembre 2026 · Périmètre : API Node/Express, schéma Prisma, frontend React, dépendances, déploiement.

Légende : ✅ corrigé dans cette version · ⚠️ à traiter · ℹ️ information

## 1. Sécurité

| # | Gravité | Constat | Statut |
|---|---------|---------|--------|
| S1 | **Critique** | **IDOR (Insecure Direct Object Reference)** : la plupart des routes `/:id` (étudiants, notes, bulletins, PDF, paiements, absences, filières, matières) ne vérifiaient pas l'établissement. Un utilisateur connecté de l'établissement A pouvait lire ou modifier les données de B en connaissant un UUID. | ✅ Contrôle systématique via `utils/scope.js` (`loadEtudiantForUser`, `assertSameEtab`). Tests automatisés. |
| S2 | **Critique** | Un **directeur pouvait réinitialiser le mot de passe du super admin** (ou de n'importe quel compte) puis s'y connecter : `PATCH /users/:id/reset-password` sans contrôle de cible. | ✅ Un directeur ne gère que les enseignants/secrétaires de son établissement. Test automatisé. |
| S3 | Élevée | Un professeur pouvait saisir/modifier des notes dans **n'importe quelle matière**, y compris d'un autre établissement. | ✅ Vérification de l'affectation professeur ↔ matière et de la filière de l'étudiant. |
| S4 | Élevée | Aucune limite de tentatives sur `/auth/login` (force brute possible). | ✅ 10 échecs / 15 min / IP + `trust proxy` pour Cloud Run. |
| S5 | Élevée | `JWT_SECRET` d'exemple faible, aucune vérification au démarrage ; algorithme JWT non épinglé. | ✅ Démarrage refusé en production si secret absent ou < 32 caractères ; `HS256` imposé. |
| S6 | Moyenne | Énumération des comptes par mesure du temps de réponse au login (bcrypt exécuté seulement si l'email existe). | ✅ Comparaison factice systématique. |
| S7 | Moyenne | Pile d'erreur (`stack`) renvoyée au client en développement, messages Prisma bruts possibles. | ✅ Gestionnaire d'erreurs central, codes Prisma traduits (404/409/400). |
| S8 | Moyenne | Identifiants (matricule, référence) générés avec `Math.random()` (prévisible). | ✅ `crypto.randomInt`. |
| S9 | Moyenne | Mots de passe de 6 caractères acceptés. | ✅ 8 minimum (API + formulaires). ⚠️ Envisager une liste de mots de passe interdits. |
| S10 | Moyenne | Comptes de démonstration affichés sur la page de connexion en production. | ✅ Affichés uniquement en développement (`VITE_DEMO`). |
| S11 | Moyenne | Le script de seed **efface toute la base** sans garde-fou. | ✅ Bloqué si `NODE_ENV=production` sauf `ALLOW_SEED=true` ; script de démo avec confirmation explicite. |
| S12 | Faible | Corps JSON jusqu'à 10 Mo (risque de saturation mémoire). | ✅ 1 Mo ; envois en masse limités à 500 lignes. |
| S13 | Faible | CSP par défaut incompatible avec l'iframe vidéo ; pas de politique adaptée. | ✅ CSP ajustée (YouTube nocookie, Vimeo, Cloud Storage) ; aucun script inline. |
| S14 | ⚠️ | Jeton JWT stocké en `localStorage` (exposé en cas de XSS). | ⚠️ À terme : cookie `HttpOnly; Secure; SameSite=Strict` + jeton CSRF. La CSP stricte réduit le risque d'ici là. |
| S15 | ⚠️ | Pas de révocation de session (un compte désactivé est bloqué, mais un jeton volé reste valide jusqu'à expiration). | ⚠️ Ajouter un `tokenVersion` sur `User`, incrémenté au changement de mot de passe. |
| S16 | ⚠️ | Pas de journal d'audit (qui a modifié quelle note, quel paiement). | ⚠️ Recommandé avant mise en production réelle (traçabilité des notes). |

## 2. Bugs fonctionnels

| # | Constat | Statut |
|---|---------|--------|
| B1 | `prisma/` à la racine : le client Prisma était généré dans le mauvais `node_modules` ; `npm run db:seed` pointait vers un fichier inexistant. | ✅ Déplacé dans `server/prisma`. |
| B2 | `prisma/migrations/` était ignoré par git → impossible de déployer avec `prisma migrate deploy`. | ✅ Migration initiale versionnée. |
| B3 | Paiement : `montantPaye: 0` était interprété comme « tout payé » (`0 \|\| montant`). Un montant payé supérieur au dû était accepté. | ✅ Corrigé + test. |
| B4 | Devise **FCFA** affichée alors que Djibouti utilise le **franc Djibouti (FDJ / DJF)**. | ✅ FDJ partout (configurable `DEVISE`). |
| B5 | Plusieurs `PrismaClient` instanciés (middleware) → pools de connexions multiples, dangereux avec Cloud SQL. | ✅ Instance unique. |
| B6 | Suppression d'une matière ayant des notes → erreur 500 (contrainte FK). | ✅ Message clair 400 ; désactivation recommandée. |
| B7 | `favicon.svg` référencé mais absent. Layout dupliquait la barre latérale sur desktop. | ✅ |
| B8 | Nombres au format anglais (`630,000`) dans certaines pages. | ✅ `fr-FR`. |
| B9 | Statistiques de seed aléatoires non reproductibles. | ✅ Générateur déterministe. |

## 3. Qualité et performance

- ✅ Tests d'intégration ajoutés (`server/test/api.test.js`, 11 scénarios, base réelle) + CI GitHub Actions.
- ✅ Index SQL ajoutés (notes par étudiant, absences par étudiant/date, paiements par statut, etc.).
- ✅ Découpage du frontend par page (`React.lazy`) : le bundle initial ne charge plus toutes les pages — utile sur réseau mobile.
- ✅ Arrêt propre sur `SIGTERM` (Cloud Run), `/api/health` vérifie la base.
- ⚠️ Les listes (étudiants, paiements) ne sont pas paginées côté API (bornées à 1 000). À paginer au-delà de quelques milliers d'étudiants.
- ⚠️ Le calcul des alertes se fait à la volée ; au-delà de ~5 000 étudiants, prévoir un calcul nocturne (Cloud Scheduler) stocké en table.
- ⚠️ Le reste du frontend existant n'a pas de tests ; ajouter Playwright sur les parcours critiques (saisie de notes, paiement).

## 4. Dépendances (`npm audit`)

- Serveur : **0 vulnérabilité** après mise à jour (`@google-cloud/storage` v9, correctifs express/body-parser/qs, suppression de `uuid`).
- Client : 2 vulnérabilités **modérées** restantes dans `react-router` 6 — correctif uniquement en v7 (changement majeur). ⚠️ Migration à planifier.

## 5. Données personnelles

- ℹ️ Les données (notes, téléphone, paiements) sont des données personnelles d'étudiants. Hébergement recommandé : région UE (`europe-west1`) avec chiffrement au repos par défaut ; vérifier les exigences locales djiboutiennes et celles de l'UNEFD.
- ✅ L'assistant IA ne reçoit que les données que l'utilisateur a déjà le droit de voir, sans outil d'écriture. ⚠️ Informer les utilisateurs que leurs questions sont traitées par un service externe (Anthropic) et prévoir une mention dans les CGU.
