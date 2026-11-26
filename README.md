# Aqoon UNEFD — le campus connecté de Djibouti

*« Aqoon » signifie « savoir » en somali.*

Plateforme de gestion universitaire pour l'UNEFD : scolarité, notes, assiduité, paiements, requêtes administratives en ligne, cours vidéo et assistant IA.

**Stack** : React 18 + Vite + Tailwind · Node.js 22 + Express · PostgreSQL + Prisma · Claude (Anthropic) · Google Cloud Run / Cloud SQL / Cloud Storage

## Fonctionnalités

| Module | Pour qui | Description |
|--------|----------|-------------|
| Portail étudiant | Étudiant | Moyenne, notes par matière, évolution, absences, reste à payer, bulletin PDF |
| Requêtes en ligne | Étudiant → Secrétariat | Attestation d'inscription, certificat de scolarité, relevé, réclamation de note ; suivi du statut ; PDF généré automatiquement une fois validé |
| Vidéothèque | Enseignant → Étudiant | Cours en vidéo (lien YouTube/Vimeo ou fichier sur Cloud Storage), par filière/matière, avec suivi de progression |
| Alerte précoce | Direction, secrétariat, enseignants | Score de risque de décrochage explicable (notes 45 %, assiduité 35 %, finances 20 %), moyenne cible pour remonter à 10/20 |
| « Demander à l'IA » | Tous | Assistant sur chaque écran, qui répond à partir des données de l'utilisateur (français, somali, afar, arabe) ; mode hors-ligne sans clé API |
| Gestion | Direction, secrétariat | Étudiants (et leurs accès portail), enseignants, filières, matières, paiements en FDJ, appel, bulletins |

Interface inspirée des Human Interface Guidelines d'Apple : typographie système, mode sombre automatique, barre d'onglets sur mobile, feuilles modales, installable sur l'écran d'accueil (PWA).

## Démarrage local

Prérequis : Node.js 20+, PostgreSQL 14+.

```bash
npm run install:all
cp .env.example .env              # renseigner DATABASE_URL et JWT_SECRET
cd server && npx prisma migrate deploy && npm run db:seed && cd ..
npm run dev                       # front : http://localhost:5173 · API : http://localhost:5000
```

Tests : `npm test` (tests d'intégration sur la base de démonstration).

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Étudiant | etudiant@unefd.dj | Etudiant@2025! |
| Étudiant (en difficulté) | ibrahim.o@unefd.dj | Etudiant@2025! |
| Enseignant | ahmed.ibrahim@unefd.dj | Prof@2025! |
| Secrétariat | secretariat@unefd.dj | Secret@2025! |
| Direction | directeur@unefd.dj | Directeur@2025! |
| Super Admin | admin@aqoon.dj | Admin@2025! |

⚠️ Données fictives : ne jamais charger ce jeu de données en production.

## Structure

```
├── client/            React (pages par rôle, design system dans src/index.css)
├── server/
│   ├── prisma/        schéma, migrations, seed
│   ├── src/           API Express (controllers, routes, utils/scope.js = contrôle d'accès)
│   └── test/          tests d'intégration
├── deploy/gcp/        setup.sh, deploy.sh, cloudbuild.yaml
├── docs/              AUDIT.md, DEPLOIEMENT_GCP.md
└── Dockerfile         image unique (API + frontend)
```

## Déploiement

Voir [docs/DEPLOIEMENT_GCP.md](docs/DEPLOIEMENT_GCP.md). En résumé :

```bash
PROJECT_ID=mon-projet ./deploy/gcp/setup.sh     # une fois
PROJECT_ID=mon-projet ./deploy/gcp/deploy.sh    # à chaque version
```

## Audit

Le rapport d'audit (sécurité, bugs, dépendances) est dans [docs/AUDIT.md](docs/AUDIT.md).

© UNEFD · République de Djibouti
