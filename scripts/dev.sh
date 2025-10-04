#!/usr/bin/env bash
set -euo pipefail

PORT_OVERRIDE="${PORT-}"

if [ -f .env.dev ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.dev
  set +a
fi

if [ -n "$PORT_OVERRIDE" ]; then
  export PORT="$PORT_OVERRIDE"
fi

export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-development}"
export APP_ENV="${APP_ENV:-development}"
export NEXT_PUBLIC_DB_TIMEOUT="${NEXT_PUBLIC_DB_TIMEOUT:-1200}"
export NEXT_PUBLIC_ADMIN_TIMEOUT="${NEXT_PUBLIC_ADMIN_TIMEOUT:-3000}"
export NEXTAUTH_URL="http://localhost:${PORT}"
export NEXT_PUBLIC_BASE_URL="http://localhost:${PORT}"

DEFAULT_DB_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_USER="${POSTGRES_USER:-hc_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-hc_pass}"
POSTGRES_DB="${POSTGRES_DB:-hc_dev}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"

if [[ "${DATABASE_URL:-}" == *"@db_dev:"* ]]; then
  export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DEFAULT_DB_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"
fi

exec npx next dev -p "$PORT" "$@"
