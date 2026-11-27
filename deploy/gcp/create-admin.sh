#!/usr/bin/env bash
# Crée le premier compte Super Admin dans la base de production (via un Cloud Run Job).
# Usage : PROJECT_ID=... SQL_INSTANCE=... ADMIN_EMAIL=vous@exemple.dj ./deploy/gcp/create-admin.sh
set -euo pipefail
: "${PROJECT_ID:?}"; : "${ADMIN_EMAIL:?Définissez ADMIN_EMAIL}"
REGION="${REGION:-europe-west1}"; SERVICE="${SERVICE:-aqoon-unefd}"; SQL_INSTANCE="${SQL_INSTANCE:-aqoon-pg}"
IMAGE="$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(spec.template.spec.containers[0].image)')"
gcloud run jobs deploy "${SERVICE}-admin" --image="$IMAGE" --region="$REGION" \
  --service-account="aqoon-run@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-cloudsql-instances="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}" \
  --set-secrets=DATABASE_URL=aqoon-database-url:latest \
  --set-env-vars="ADMIN_EMAIL=${ADMIN_EMAIL}" --command=node --args=prisma/create-admin.js --max-retries=0 >/dev/null
EXEC="$(gcloud run jobs execute "${SERVICE}-admin" --region="$REGION" --wait --format='value(metadata.name)')"
sleep 5
echo "──── Résultat ────"
gcloud logging read "resource.type=cloud_run_job AND labels.\"run.googleapis.com/execution_name\"=\"${EXEC}\"" \
  --project="$PROJECT_ID" --limit=10 --format='value(textPayload)' | tac
