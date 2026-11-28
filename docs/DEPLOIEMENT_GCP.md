# Déploiement sur Google Cloud

## Architecture

```
Navigateur ──HTTPS──▶ Cloud Run « aqoon-unefd »  (API Express + frontend React, 1 image)
                         │  socket Unix /cloudsql
                         ├──────────────▶ Cloud SQL PostgreSQL 16 (sauvegardes + PITR)
                         ├── Secret Manager : DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
                         └── URL signées ──▶ Cloud Storage (bucket privé des vidéos)
Navigateur ──PUT/GET direct (URL signée)──▶ Cloud Storage
```

Pourquoi l'envoi direct au bucket : Cloud Run limite une requête HTTP/1 à 32 Mo ; une vidéo de cours fait souvent 200–500 Mo. Le serveur ne fait que signer une URL valable 15 min.

## 1. Première installation (une seule fois)

```bash
gcloud auth login
export PROJECT_ID=unefd-aqoon          # votre projet GCP (facturation activée)
export REGION=europe-west1
export APP_ORIGIN=https://aqoon.unefd.dj   # domaine final (CORS du bucket)
./deploy/gcp/setup.sh
```

Le script crée : APIs, Artifact Registry, Cloud SQL (PostgreSQL 16, sauvegardes quotidiennes, PITR, protection contre la suppression), base + utilisateur au mot de passe aléatoire, secrets, bucket privé avec CORS, compte de service `aqoon-run` (Cloud SQL client, lecture des secrets, objets du bucket, signature d'URL).

Ajouter la clé de l'assistant IA (facultatif, sinon mode hors-ligne) :

```bash
printf '%s' "sk-ant-..." | gcloud secrets versions add aqoon-anthropic-key --data-file=-
```

## 2. Déployer (à chaque version)

```bash
PROJECT_ID=$PROJECT_ID CLIENT_URL=https://aqoon.unefd.dj ./deploy/gcp/deploy.sh
```

Cloud Build : construit l'image → la pousse → exécute `prisma migrate deploy` dans un **Cloud Run Job** → déploie le service. Si la migration échoue, le service n'est pas mis à jour.

Déploiement automatique : créer un déclencheur Cloud Build sur la branche `main` avec `deploy/gcp/cloudbuild.yaml` et les substitutions `_BUCKET`, `_SA`, `_CLIENT_URL`.

## 3. Données de démonstration (environnement de test uniquement)

```bash
PROJECT_ID=$PROJECT_ID ./deploy/gcp/seed-demo.sh   # demande de taper « EFFACER »
```

## 4. Domaine personnalisé

```bash
gcloud beta run domain-mappings create --service=aqoon-unefd --domain=aqoon.unefd.dj --region=$REGION
```
(ou un Load Balancer HTTPS + Cloud Armor pour filtrer le trafic et ajouter un WAF).

## 5. Coûts indicatifs (à vérifier sur la calculatrice GCP)

| Ressource | Configuration | Ordre de grandeur / mois |
|-----------|---------------|--------------------------|
| Cloud Run | 0 → 10 instances, 1 vCPU / 512 Mo | faible si trafic modéré (facturé à l'usage) |
| Cloud SQL | `db-g1-small` | le poste principal — passer à `db-custom-1-3840` + HA pour la production |
| Cloud Storage | vidéos | stockage + **sortie réseau** (le visionnage coûte plus que le stockage) |
| Assistant IA | Claude, effort `low` | proportionnel au nombre de questions ; limité à 30 questions / 10 min / utilisateur |

Conseil Djibouti : pour limiter la bande passante (forfaits mobiles des étudiants et sortie réseau GCP), privilégier des vidéos YouTube **non répertoriées** pour les cours longs, et réserver l'hébergement de fichiers aux contenus qui ne doivent pas sortir de l'établissement.

## 6. Points d'attention

- **Région** : `europe-west1` (Belgique) offre un bon rapport latence/prix depuis Djibouti (câbles sous-marins vers Marseille). `me-central1` (Doha) est une alternative plus proche ; mesurer la latence réelle avant de choisir.
- **Démarrage à froid** : `--min-instances=0` économise de l'argent mais ajoute ~1–2 s à la première requête. Mettre `--min-instances=1` pendant les périodes d'examens.
- **Connexions SQL** : `connection_limit=5` par instance × 10 instances max = 50 connexions ; adapter si vous augmentez `max-instances`.
- **Sauvegardes** : tester une restauration avant la mise en production.
- **Journaux** : Cloud Logging reçoit les journaux `combined` ; créer une alerte sur les erreurs 5xx.

## 7. Instance Cloud SQL partagée entre plusieurs applications

Une seule instance PostgreSQL peut héberger plusieurs applications : **une base + un utilisateur par application**.

```bash
export SQL_INSTANCE=amd-postgres      # nom générique, pas lié à une application
./deploy/gcp/setup.sh                 # crée l'instance si elle n'existe pas, puis la base « aqoon »
```

Ensuite, isoler l'application (voir `deploy/gcp/isolation.sql`) :

```bash
gcloud sql users set-password postgres --instance=$SQL_INSTANCE --prompt-for-password
gcloud sql connect $SQL_INSTANCE --user=postgres --database=aqoon < deploy/gcp/isolation.sql
```

Pour une future application : `gcloud sql databases create autre_app --instance=$SQL_INSTANCE`, un utilisateur dédié, son propre secret `DATABASE_URL`, puis le même script d'isolation.

Points d'attention :
- **Connexions** : `db-g1-small` accepte ~50 connexions au total ; chaque application les consomme via `connection_limit`. Passer à `db-custom-1-3840` (≈ 100+) quand une 2e application arrive en production.
- **Pannes et maintenance** : une instance partagée = un point de défaillance commun. Activer la haute disponibilité (`--availability-type=REGIONAL`) en production.
- **Région** : déployer les futures applications Cloud Run dans la même région que l'instance.
