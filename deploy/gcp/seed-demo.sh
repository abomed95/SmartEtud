#!/usr/bin/env bash
# ⚠️ Charge les données de DÉMONSTRATION (efface la base). Uniquement pour un environnement de test.
set -euo pipefail
: "${PROJECT_ID:?}"; REGION="${REGION:-europe-west1}"; SERVICE="${SERVICE:-aqoon-unefd}"
read -r -p "Cela EFFACE toute la base du projet $PROJECT_ID. Taper « EFFACER » pour confirmer : " ok
[ "$ok" = "EFFACER" ] || { echo "Annulé."; exit 1; }
IMAGE="$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(spec.template.spec.containers[0].image)')"
gcloud run jobs deploy "${SERVICE}-seed" --image="$IMAGE" --region="$REGION" \
  --service-account="aqoon-run@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-cloudsql-instances="${PROJECT_ID}:${REGION}:aqoon-pg" \
  --set-secrets=DATABASE_URL=aqoon-database-url:latest \
  --set-env-vars=ALLOW_SEED=true --command=node --args=prisma/seed.js --max-retries=0
gcloud run jobs execute "${SERVICE}-seed" --region="$REGION" --wait
