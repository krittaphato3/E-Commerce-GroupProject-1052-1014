#!/bin/sh
set -e

# Optional migration & seed hook for Cloud Run migration jobs or standalone testing
if [ "$RUN_MIGRATIONS" = "true" ] || [ "$RUN_MIGRATIONS" = "1" ]; then
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

    echo "[CampusBites] Running database seed..."
    npm run db:seed
  fi
fi

exec "$@"
