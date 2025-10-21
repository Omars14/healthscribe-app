#!/usr/bin/env bash
set -Eeuo pipefail

# --- Config / Paths ---
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"
LOG_DIR="${PROJECT_DIR}/ops/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/deploy-$(date +%Y%m%d-%H%M%S).log"
touch "$LOG_FILE"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "[INFO] Starting deploy at $(date)"

# Compose binary
DOCKER_COMPOSE="docker compose"

# Load env (without echoing secrets)
ENV_FILE="${ENV_FILE:-.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] Missing $ENV_FILE in $PROJECT_DIR"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Sanity checks (required public build-time vars)
REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_N8N_URL
  NEXT_PUBLIC_N8N_WEBHOOK_URL
  NEXT_PUBLIC_URL
  NEXT_PUBLIC_API_URL
  NEXT_PUBLIC_SITE_URL
  APP_HOST
  N8N_HOST
  TRAEFIK_ACME_EMAIL
  N8N_ENCRYPTION_KEY
)
for v in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "[ERROR] Missing required env var: $v"
    exit 1
  fi
done

# Ensure external traefik network exists
docker network inspect traefik-proxy >/dev/null 2>&1 || docker network create traefik-proxy

# Track previous image tag for rollback
STATE_DIR="${PROJECT_DIR}/.deploy"
mkdir -p "$STATE_DIR"
LAST_TAG_FILE="${STATE_DIR}/last_app_tag"
PREV_TAG="$(test -f "$LAST_TAG_FILE" && cat "$LAST_TAG_FILE" || echo "")"

# New tag for this build
TIMESTAMP_TAG="release-$(date +%Y%m%d%H%M%S)"
export APP_IMAGE_TAG="$TIMESTAMP_TAG"

echo "[INFO] Building image healthscribe/app:${APP_IMAGE_TAG}"
$DOCKER_COMPOSE build --pull app

echo "[INFO] Bringing up services"
# Do not fully 'down' to avoid network/volume churn; remove orphans safely
$DOCKER_COMPOSE up -d --remove-orphans

# Health check function (try HTTPS via Traefik, fallback to container port)
healthcheck() {
  local host="$1"
  for i in {1..30}; do
    echo "[INFO] Health check attempt $i/30 for $host..."
    if curl -fsS "https://${host}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 3
  done
  return 1
}

echo "[INFO] Waiting for app health via https://${APP_HOST}"
if ! healthcheck "$APP_HOST"; then
  echo "[ERROR] App healthcheck failed. Attempting rollback..."
  if [[ -n "$PREV_TAG" ]]; then
    export APP_IMAGE_TAG="$PREV_TAG"
    echo "[INFO] Rolling back to healthscribe/app:${APP_IMAGE_TAG}"
    $DOCKER_COMPOSE up -d --no-deps app || true
    if healthcheck "$APP_HOST"; then
      echo "[INFO] Rollback succeeded."
      exit 1
    else
      echo "[ERROR] Rollback failed. Check logs."
      exit 1
    fi
  else
    echo "[ERROR] No previous tag to rollback to."
    exit 1
  fi
fi

echo "$APP_IMAGE_TAG" > "$LAST_TAG_FILE"

echo "[INFO] Pruning unused images and networks (safe)"
docker image prune -f >/dev/null 2>&1 || true
docker network prune -f >/dev/null 2>&1 || true

echo "[INFO] Deploy done at $(date)"
echo "[INFO] App: https://${APP_HOST}"
echo "[INFO] n8n: https://${N8N_HOST}"
