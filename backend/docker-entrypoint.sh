#!/bin/sh
set -e

echo "[CampusBites Backend] Starting service..."

if [ -n "$DATABASE_URL" ]; then
  echo "[CampusBites Backend] Checking database connectivity and applying migrations..."
  RETRY_COUNT=0
  MAX_RETRIES=30
  until npx prisma migrate deploy; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
      echo "[CampusBites Backend] Database connection failed after $MAX_RETRIES attempts."
      exit 1
    fi
    echo "[CampusBites Backend] Database not ready yet ($RETRY_COUNT/$MAX_RETRIES). Retrying in 1s..."
    sleep 1
  done
  echo "[CampusBites Backend] Migrations applied successfully."

  echo "[CampusBites Backend] Running database seed..."
  npm run db:seed
fi

echo "[CampusBites Backend] Executing command: $@"
exec "$@"
