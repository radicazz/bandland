#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-bandland}"
REPO_DIR="${2:-$(pwd)}"
SERVICE_USER="${3:-www-data}"
ENV_FILE_OVERRIDE="${4:-${ENV_FILE:-}}"

if [ ! -f "$REPO_DIR/package.json" ]; then
  echo "Error: package.json not found in $REPO_DIR"
  exit 1
fi

REPO_DIR="$(cd "$REPO_DIR" && pwd)"

SUDO=""
if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "Error: this script must run as root or with sudo available."
    exit 1
  fi
fi

NPM_BIN=$(command -v npm || true)
if [ -z "$NPM_BIN" ]; then
  echo "Error: npm not found in PATH. Install Node.js or ensure npm is available."
  exit 1
fi

ENV_FILE=""
if [ -n "$ENV_FILE_OVERRIDE" ]; then
  if [ ! -f "$ENV_FILE_OVERRIDE" ]; then
    echo "Error: environment file not found: $ENV_FILE_OVERRIDE"
    exit 1
  fi
  ENV_FILE="$(cd "$(dirname "$ENV_FILE_OVERRIDE")" && pwd)/$(basename "$ENV_FILE_OVERRIDE")"
elif [ -f "$REPO_DIR/.env.production" ]; then
  ENV_FILE="$REPO_DIR/.env.production"
elif [ -f "$REPO_DIR/.env.local" ]; then
  ENV_FILE="$REPO_DIR/.env.local"
elif [ -f "$REPO_DIR/.env" ]; then
  ENV_FILE="$REPO_DIR/.env"
fi

UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "Creating systemd service: $SERVICE_NAME"
echo "  Repository: $REPO_DIR"
echo "  User: $SERVICE_USER"
if [ -n "$ENV_FILE" ]; then
  echo "  Environment file: $ENV_FILE"
else
  echo "  Environment file: (none found)"
fi
echo ""

SERVICE_CONTENT="[Unit]
Description=Bandland Next.js
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$REPO_DIR
Environment=NODE_ENV=production"

if [ -n "$ENV_FILE" ]; then
  SERVICE_CONTENT="$SERVICE_CONTENT
EnvironmentFile=$ENV_FILE"
fi

SERVICE_CONTENT="$SERVICE_CONTENT
ExecStart=$NPM_BIN run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target"

printf "%s\n" "$SERVICE_CONTENT" | $SUDO tee "$UNIT_FILE" >/dev/null

echo "✓ Created $UNIT_FILE"
echo ""

$SUDO systemctl daemon-reload
$SUDO systemctl enable "$SERVICE_NAME"
echo "✓ Service enabled"
echo ""

if [ -n "$ENV_FILE" ]; then
  echo "Environment file found. Starting service..."
  $SUDO systemctl restart "$SERVICE_NAME"
  echo "✓ Service started"
  echo ""
  $SUDO systemctl status "$SERVICE_NAME" --no-pager -l
else
  echo "⚠ No environment file found (.env.production, .env.local, or .env)"
  echo "  Run: npm run setup-access"
  echo "  Then: sudo systemctl start $SERVICE_NAME"
fi
