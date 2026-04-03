#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-${SERVICE_NAME:-bandland}}"
REPO_DIR="${2:-${REPO_DIR:-$(pwd)}}"
SERVICE_USER="${3:-${SERVICE_USER:-www-data}}"
DATA_ROOT="${4:-${DATA_ROOT:-/var/lib/${SERVICE_NAME}}}"
ENV_FILE_OVERRIDE="${5:-${ENV_FILE:-}}"
FORCE="${FORCE:-0}"
RUN_SETUP_SYSTEMD="${RUN_SETUP_SYSTEMD:-1}"
BOOTSTRAP_USE_SUDO="${BOOTSTRAP_USE_SUDO:-auto}"

if [ ! -f "$REPO_DIR/package.json" ]; then
  echo "Error: package.json not found in $REPO_DIR"
  exit 1
fi

REPO_DIR="$(cd "$REPO_DIR" && pwd)"

CURRENT_USER="$(id -un)"
SUDO=""

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

copy_if_needed() {
  local source_path="$1"
  local dest_path="$2"

  if [ -f "$dest_path" ] && [ "$FORCE" != "1" ]; then
    echo "Preserving existing file: $dest_path"
    return
  fi

  $SUDO cp "$source_path" "$dest_path"
  set_owner "$dest_path"
  echo "Seeded file: $dest_path"
}

resolve_existing_parent() {
  local target_path="$1"
  while [ ! -e "$target_path" ]; do
    target_path="$(dirname "$target_path")"
  done
  printf '%s' "$target_path"
}

path_requires_sudo() {
  local target_path="$1"
  local parent_path
  parent_path="$(resolve_existing_parent "$target_path")"
  if [ -w "$parent_path" ]; then
    return 1
  fi
  return 0
}

require_sudo() {
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
    return
  fi

  echo "Error: this script needs elevated access but sudo is not available."
  exit 1
}

set_owner() {
  local target_path="$1"

  if [ -n "$SUDO" ] || [ "${EUID:-$(id -u)}" -eq 0 ]; then
    $SUDO chown "$SERVICE_USER:$SERVICE_USER" "$target_path"
    return
  fi

  if [ "$SERVICE_USER" != "$CURRENT_USER" ]; then
    echo "Error: cannot set ownership to $SERVICE_USER without sudo."
    echo "Re-run with sudo, BOOTSTRAP_USE_SUDO=always, or SERVICE_USER=$CURRENT_USER."
    exit 1
  fi
}

set_owner_recursive() {
  local target_path="$1"

  if [ -n "$SUDO" ] || [ "${EUID:-$(id -u)}" -eq 0 ]; then
    $SUDO chown -R "$SERVICE_USER:$SERVICE_USER" "$target_path"
    return
  fi

  if [ "$SERVICE_USER" != "$CURRENT_USER" ]; then
    echo "Error: cannot set ownership to $SERVICE_USER without sudo."
    echo "Re-run with sudo, BOOTSTRAP_USE_SUDO=always, or SERVICE_USER=$CURRENT_USER."
    exit 1
  fi
}

ENV_FILE_PATH="$(resolve_env_file || true)"
CONTENT_DIR="${CONTENT_DIR:-$(get_env_value "$ENV_FILE_PATH" CONTENT_DIR)}"
CONTENT_HISTORY_DIR="${CONTENT_HISTORY_DIR:-$(get_env_value "$ENV_FILE_PATH" CONTENT_HISTORY_DIR)}"
AUTH_RATE_LIMIT_DIR="${AUTH_RATE_LIMIT_DIR:-$(get_env_value "$ENV_FILE_PATH" AUTH_RATE_LIMIT_DIR)}"

CONTENT_DIR="${CONTENT_DIR:-$DATA_ROOT/content}"
CONTENT_HISTORY_DIR="${CONTENT_HISTORY_DIR:-$CONTENT_DIR/.history}"
AUTH_RATE_LIMIT_DIR="${AUTH_RATE_LIMIT_DIR:-$DATA_ROOT/auth-rate-limit}"

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  case "$BOOTSTRAP_USE_SUDO" in
    1|true|always)
      require_sudo
      ;;
    0|false|never)
      SUDO=""
      ;;
    auto|"")
      if [ "$RUN_SETUP_SYSTEMD" != "0" ] || [ "$SERVICE_USER" != "$CURRENT_USER" ] || path_requires_sudo "$CONTENT_DIR" || path_requires_sudo "$CONTENT_HISTORY_DIR" || path_requires_sudo "$AUTH_RATE_LIMIT_DIR"; then
        require_sudo
      fi
      ;;
    *)
      echo "Error: BOOTSTRAP_USE_SUDO must be auto, always, or never."
      exit 1
      ;;
  esac
fi

echo "Bootstrapping VPS layout"
echo "  Service: $SERVICE_NAME"
echo "  Repository: $REPO_DIR"
echo "  Service user: $SERVICE_USER"
echo "  Content dir: $CONTENT_DIR"
echo "  History dir: $CONTENT_HISTORY_DIR"
echo "  Rate-limit dir: $AUTH_RATE_LIMIT_DIR"
if [ -n "$ENV_FILE_PATH" ]; then
  echo "  Env file: $ENV_FILE_PATH"
else
  echo "  Env file: (not found)"
fi

$SUDO mkdir -p "$CONTENT_DIR" "$CONTENT_HISTORY_DIR" "$AUTH_RATE_LIMIT_DIR"
set_owner_recursive "$CONTENT_DIR"
set_owner_recursive "$AUTH_RATE_LIMIT_DIR"

copy_if_needed "$REPO_DIR/content/shows.json" "$CONTENT_DIR/shows.json"
copy_if_needed "$REPO_DIR/content/merch.json" "$CONTENT_DIR/merch.json"
copy_if_needed "$REPO_DIR/content/admin-audit.json" "$CONTENT_DIR/admin-audit.json"

if [ -n "$ENV_FILE_PATH" ] && [ "$RUN_SETUP_SYSTEMD" != "0" ]; then
  echo "Updating systemd service..."
  "$REPO_DIR/scripts/setup-systemd.sh" "$SERVICE_NAME" "$REPO_DIR" "$SERVICE_USER" "$ENV_FILE_PATH"
else
  echo "Bootstrap completed."
  if [ -z "$ENV_FILE_PATH" ]; then
    echo "Next step: create .env.production with npm run setup-access -- --env prod"
  fi
  echo "Then run: sudo ./scripts/setup-systemd.sh $SERVICE_NAME $REPO_DIR $SERVICE_USER"
fi
