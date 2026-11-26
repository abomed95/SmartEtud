#!/usr/bin/env bash
# Construit l'image, applique les migrations et déploie sur Cloud Run (via Cloud Build).
# Usage : PROJECT_ID=mon-projet BUCKET=mon-bucket [CLIENT_URL=https://aqoon.unefd.dj] ./deploy/gcp/deploy.sh
set -euo pipefail
: "${PROJECT_ID:?Définissez PROJECT_ID}"
REGION="${REGION:-europe-west1}"
BUCKET="${BUCKET:-${PROJECT_ID}-aqoon-videos}"
SA="${SA:-aqoon-run@${PROJECT_ID}.iam.gserviceaccount.com}"
SERVICE="${SERVICE:-aqoon-unefd}"
CLIENT_URL="${CLIENT_URL:-}"

cd "$(dirname "$0")/../.."
gcloud builds submit --project="$PROJECT_ID" --region="$REGION" \
  --config=deploy/gcp/cloudbuild.yaml \
  --substitutions="_REGION=$REGION,_BUCKET=$BUCKET,_SA=$SA,_SERVICE=$SERVICE,_CLIENT_URL=$CLIENT_URL" .

URL="$(gcloud run services describe "$SERVICE" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
echo "✅ Déployé : $URL"
curl -fsS "$URL/api/health" && echo
