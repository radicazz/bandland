#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${REPO_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
DEFAULT_SERVICE_NAME="bandland"
SERVICE_NAME="${SERVICE_NAME:-$DEFAULT_SERVICE_NAME}"
ENV_FILE_OVERRIDE="${ENV_FILE:-}"
HEALTHCHECK_URL_OVERRIDE="${HEALTHCHECK_URL:-}"

if [ ! -f "$REPO_DIR/package.json" ]; then
  echo "Run this script from the repo root or set REPO_DIR (package.json not found)."
  exit 1
fi

cd "$REPO_DIR"

SUDO=""
if [ "${EUID:-$(id -u)}" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
fi

resolve_env_file() {
  if [ -n "$ENV_FILE_OVERRIDE" ]; then
    echo "$ENV_FILE_OVERRIDE"
    return
  fi

  for candidate in "$REPO_DIR/.env.production" "$REPO_DIR/.env.local" "$REPO_DIR/.env"; do
    if [ -f "$candidate" ]; then
      echo "$candidate"
      return
    fi
  done
}

strip_quotes() {
  local value="$1"
  if [[ "$value" =~ ^\".*\"$ ]] || [[ "$value" =~ ^\'.*\'$ ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

get_env_value() {
  local env_file="$1"
  local key="$2"
  if [ -z "$env_file" ] || [ ! -f "$env_file" ]; then
    return
  fi

  local value
  value="$(
    awk -F= -v key="$key" '
      $1 ~ "^[[:space:]]*" key "[[:space:]]*$" {
        sub(/^[^=]*=/, "", $0)
        print $0
        exit
      }
    ' "$env_file"
  )"
  strip_quotes "$value"
}

show_service_debug() {
  if command -v systemctl >/dev/null 2>&1; then
    echo ""
    $SUDO systemctl status "$SERVICE_NAME" --no-pager -l || true
    echo ""
    if command -v journalctl >/dev/null 2>&1; then
      $SUDO journalctl -u "$SERVICE_NAME" -n 80 --no-pager || true
    fi
  fi
}

ENV_FILE_PATH="$(resolve_env_file || true)"
if [ -z "$ENV_FILE_PATH" ]; then
  echo "Error: no env file found (.env.production, .env.local, or .env)."
  exit 1
fi

APP_PORT_VALUE="$(get_env_value "$ENV_FILE_PATH" APP_PORT)"
DEPLOY_HEALTHCHECK_URL_VALUE="$(get_env_value "$ENV_FILE_PATH" DEPLOY_HEALTHCHECK_URL)"
HEALTHCHECK_URL="${HEALTHCHECK_URL_OVERRIDE:-${DEPLOY_HEALTHCHECK_URL_VALUE:-http://127.0.0.1:${APP_PORT_VALUE:-3000}/api/health}}"

git pull --ff-only

node "$REPO_DIR/scripts/preflight-deploy.mjs" \
  --repo-dir "$REPO_DIR" \
  --service-name "$SERVICE_NAME" \
  --env-file "$ENV_FILE_PATH"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run build

if command -v systemctl >/dev/null 2>&1; then
  if systemctl list-unit-files | grep -q "^${SERVICE_NAME}\\.service"; then
    if ! $SUDO systemctl restart "${SERVICE_NAME}"; then
      echo "Service restart failed: ${SERVICE_NAME}.service"
      show_service_debug
      exit 1
    fi
  else
    echo "Error: ${SERVICE_NAME}.service not found."
    exit 1
  fi
else
  echo "Error: systemctl is not available on this host."
  exit 1
fi

if ! node "$REPO_DIR/scripts/healthcheck.mjs" "$HEALTHCHECK_URL"; then
  echo "Deploy health check failed for $HEALTHCHECK_URL"
  show_service_debug
  exit 1
fi

echo "Deploy completed successfully."
