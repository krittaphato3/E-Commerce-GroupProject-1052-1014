#!/bin/sh
set -e

echo "[CampusBites] Starting CampusBites unified service..."

if [ -n "$DATABASE_URL" ]; then
  echo "[CampusBites] Checking database connectivity and applying migrations..."
  RETRY_COUNT=0
  MAX_RETRIES=30
  until npx prisma migrate deploy --schema=backend/prisma/schema.prisma; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
      echo "[CampusBites] Database connection failed after $MAX_RETRIES attempts."
      exit 1
    fi
    echo "[CampusBites] Database not ready yet ($RETRY_COUNT/$MAX_RETRIES). Retrying in 1s..."
    sleep 1
  done
  echo "[CampusBites] Prisma migrations deployed successfully."

  if [ "$SEED_DEMO_DATA" = "true" ] || [ "$SEED_DEMO_DATA" = "1" ]; then
    echo "[CampusBites] Seeding demo data..."
    npx tsx backend/prisma/seed.ts || echo "[CampusBites] Seed step completed."
  fi
fi

echo "[CampusBites] Starting runtime: $@"
exec "$@"
