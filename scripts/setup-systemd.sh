#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-bandland}"
REPO_DIR="${2:-$(pwd)}"
SERVICE_USER="${3:-www-data}"

if [ ! -f "$REPO_DIR/package.json" ]; then
  echo "Error: package.json not found in $REPO_DIR"
  exit 1
fi

UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "Creating systemd service: $SERVICE_NAME"
echo "  Repository: $REPO_DIR"
echo "  User: $SERVICE_USER"
echo ""

# Start building the service file
SERVICE_CONTENT="[Unit]
Description=Bandland Next.js
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$REPO_DIR
Environment=NODE_ENV=production"

# Load environment variables from .env.production if it exists
if [ -f "$REPO_DIR/.env.production" ]; then
  echo "  Loading env from: .env.production"
  while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi
    # Extract key and value
    key=$(echo "$line" | cut -d= -f1)
    value=$(echo "$line" | cut -d= -f2-)
    # Remove surrounding quotes from value if present
    value=$(echo "$value" | sed "s/^['\"]//;s/['\"]$//")
    # Add as quoted Environment directive
    SERVICE_CONTENT="$SERVICE_CONTENT
Environment=\"$key=$value\""
  done < "$REPO_DIR/.env.production"
elif [ -f "$REPO_DIR/.env.local" ]; then
  echo "  Loading env from: .env.local"
  while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi
    # Extract key and value
    key=$(echo "$line" | cut -d= -f1)
    value=$(echo "$line" | cut -d= -f2-)
    # Remove surrounding quotes from value if present, unescape \$
    value=$(echo "$value" | sed "s/^['\"]//;s/['\"]$//;s/\\\\\$/\$/g")
    # Add as quoted Environment directive
    SERVICE_CONTENT="$SERVICE_CONTENT
Environment=\"$key=$value\""
  done < "$REPO_DIR/.env.local"
fi

SERVICE_CONTENT="$SERVICE_CONTENT
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target"

echo "$SERVICE_CONTENT" > "$UNIT_FILE"

echo "✓ Created $UNIT_FILE"
echo ""

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
echo "✓ Service enabled"
echo ""

if [ -f "$REPO_DIR/.env.local" ] || [ -f "$REPO_DIR/.env.production" ]; then
  echo "Environment file found. Starting service..."
  systemctl restart "$SERVICE_NAME"
  echo "✓ Service started"
  echo ""
  systemctl status "$SERVICE_NAME" --no-pager -l
else
  echo "⚠ No environment file found (.env.local or .env.production)"
  echo "  Run: npm run setup-access"
  echo "  Then: sudo systemctl start $SERVICE_NAME"
fi
