#!/usr/bin/env bash
set -euo pipefail

if [ -f .env.dev ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.dev
  set +a
fi

export NODE_ENV="${NODE_ENV:-development}"
export APP_ENV="${APP_ENV:-development}"
export NEXT_PUBLIC_DB_TIMEOUT="${NEXT_PUBLIC_DB_TIMEOUT:-1200}"
export NEXT_PUBLIC_ADMIN_TIMEOUT="${NEXT_PUBLIC_ADMIN_TIMEOUT:-3000}"

exec npx next dev "$@"
