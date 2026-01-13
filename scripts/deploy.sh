#!/usr/bin/env bash
set -euo pipefail

DEFAULT_SERVICE_NAME="bandland"
SERVICE_NAME="${SERVICE_NAME:-$DEFAULT_SERVICE_NAME}"

if [ ! -f package.json ]; then
  echo "Run this script from the repo root (package.json not found)."
  exit 1
fi

git pull --ff-only

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run build

if command -v systemctl >/dev/null 2>&1; then
  if systemctl list-unit-files | grep -q "^${SERVICE_NAME}\\.service"; then
    sudo systemctl restart "${SERVICE_NAME}"
  else
    echo "Skipping restart: ${SERVICE_NAME}.service not found."
  fi
else
  echo "Skipping restart: systemctl not available."
fi
