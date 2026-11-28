#!/usr/bin/env bash
# =============================================================================
# Aqoon UNEFD — mise en place initiale sur Google Cloud (à exécuter UNE fois).
# Crée : APIs, Artifact Registry, Cloud SQL PostgreSQL, secrets, bucket vidéos,
#        compte de service à privilèges minimaux.
# Usage : PROJECT_ID=mon-projet REGION=europe-west1 ./deploy/gcp/setup.sh
# Prérequis : gcloud authentifié avec un compte « Owner » ou équivalent.
# =============================================================================
set -euo pipefail

: "${PROJECT_ID:?Définissez PROJECT_ID}"
REGION="${REGION:-europe-west1}"           # Belgique : bon compromis latence/prix depuis Djibouti
SQL_INSTANCE="${SQL_INSTANCE:-aqoon-pg}"
SQL_TIER="${SQL_TIER:-db-g1-small}"        # prod : db-custom-1-3840 + --availability-type=REGIONAL
DB_NAME="${DB_NAME:-aqoon}"
DB_USER="${DB_USER:-aqoon_app}"
REPO="${REPO:-aqoon}"
BUCKET="${BUCKET:-${PROJECT_ID}-aqoon-videos}"
SA_NAME="${SA_NAME:-aqoon-run}"
SA="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
APP_ORIGIN="${APP_ORIGIN:-*}"              # à restreindre au domaine final (ex. https://aqoon.unefd.dj)

gcloud config set project "$PROJECT_ID" >/dev/null

echo "▶ Activation des APIs…"
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com cloudbuild.googleapis.com storage.googleapis.com \
  iamcredentials.googleapis.com logging.googleapis.com

echo "▶ Artifact Registry…"
gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" \
    --description="Images Aqoon UNEFD"

echo "▶ Compte de service d'exécution (privilèges minimaux)…"
gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 || \
  { gcloud iam service-accounts create "$SA_NAME" --display-name="Aqoon UNEFD - Cloud Run"; sleep 30; }
for role in roles/cloudsql.client roles/secretmanager.secretAccessor roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role="$role" --condition=None >/dev/null
done
# Signature des URL Cloud Storage sans clé privée : le compte signe via l'API IAM (signBlob)
gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --member="serviceAccount:$SA" --role=roles/iam.serviceAccountTokenCreator >/dev/null

echo "▶ Cloud SQL PostgreSQL 16 ($SQL_TIER) — peut prendre ~10 min…"
gcloud sql instances describe "$SQL_INSTANCE" >/dev/null 2>&1 || \
  gcloud sql instances create "$SQL_INSTANCE" --database-version=POSTGRES_16 --edition=ENTERPRISE --tier="$SQL_TIER" \
    --region="$REGION" --storage-auto-increase --backup-start-time=02:00 \
    --enable-point-in-time-recovery --deletion-protection
gcloud sql databases describe "$DB_NAME" --instance="$SQL_INSTANCE" >/dev/null 2>&1 || \
  gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE"

if ! gcloud secrets describe aqoon-database-url >/dev/null 2>&1; then
  DB_PASS="$(openssl rand -base64 30 | tr -dc 'A-Za-z0-9' | head -c 32)"
  gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASS"
  CONN="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
  # connection_limit bas : plusieurs instances Cloud Run partagent les connexions de la base
  printf 'postgresql://%s:%s@localhost/%s?host=/cloudsql/%s&connection_limit=5' "$DB_USER" "$DB_PASS" "$DB_NAME" "$CONN" | \
    gcloud secrets create aqoon-database-url --data-file=- --replication-policy=automatic
  unset DB_PASS
fi

echo "▶ Secrets applicatifs…"
gcloud secrets describe aqoon-jwt-secret >/dev/null 2>&1 || \
  openssl rand -hex 48 | tr -d '\n' | gcloud secrets create aqoon-jwt-secret --data-file=- --replication-policy=automatic
if ! gcloud secrets describe aqoon-anthropic-key >/dev/null 2>&1; then
  # Valeur « none » = assistant en mode hors-ligne. Ajoutez la vraie clé plus tard :
  #   printf '%s' "sk-ant-..." | gcloud secrets versions add aqoon-anthropic-key --data-file=-
  printf 'none' | gcloud secrets create aqoon-anthropic-key --data-file=- --replication-policy=automatic
fi

echo "▶ Bucket vidéos privé ($BUCKET)…"
gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1 || \
  gcloud storage buckets create "gs://$BUCKET" --location="$REGION" \
    --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="serviceAccount:$SA" --role=roles/storage.objectAdmin >/dev/null
# CORS : le navigateur envoie la vidéo directement au bucket (PUT sur URL signée) et la lit (GET)
CORS_FILE="$(mktemp)"
cat > "$CORS_FILE" <<JSON
[{"origin": ["$APP_ORIGIN"], "method": ["PUT", "GET", "HEAD"], "responseHeader": ["Content-Type", "Range"], "maxAgeSeconds": 3600}]
JSON
gcloud storage buckets update "gs://$BUCKET" --cors-file="$CORS_FILE"
rm -f "$CORS_FILE"

echo "▶ Compte de service dédié à Cloud Build (déploiement Cloud Run + jobs de migration)…"
# (pause après création : un compte de service neuf met quelques secondes à être visible par IAM)
# Compte explicite : les projets récents n'utilisent plus <numéro>@cloudbuild.gserviceaccount.com
BUILD_SA="aqoon-build@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud iam service-accounts describe "$BUILD_SA" >/dev/null 2>&1 || \
  { gcloud iam service-accounts create aqoon-build --display-name="Aqoon UNEFD - Cloud Build"; sleep 30; }
for role in roles/run.admin roles/artifactregistry.writer roles/logging.logWriter roles/storage.objectViewer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$BUILD_SA" --role="$role" --condition=None >/dev/null
done
gcloud iam service-accounts add-iam-policy-binding "$SA" --member="serviceAccount:$BUILD_SA" --role=roles/iam.serviceAccountUser >/dev/null

cat <<MSG

✅ Infrastructure prête.
   Compte de service : $SA
   Bucket vidéos     : $BUCKET
   Instance SQL      : ${PROJECT_ID}:${REGION}:${SQL_INSTANCE}

Étape suivante :
   PROJECT_ID=$PROJECT_ID REGION=$REGION BUCKET=$BUCKET ./deploy/gcp/deploy.sh
MSG
