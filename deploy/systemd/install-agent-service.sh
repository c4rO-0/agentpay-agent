#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

SERVICE_NAME=${SERVICE_NAME:-agent}
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

RUN_USER=${RUN_USER:-$(id -un)}
RUN_GROUP=${RUN_GROUP:-$(id -gn)}
APP_DIR=${APP_DIR:-$REPO_DIR}
NODE_BIN=${NODE_BIN:-$(command -v node)}

if [ -z "${NODE_BIN}" ]; then
  echo "[agent] node binary not found in PATH" >&2
  exit 1
fi

PATH_ENV="$(dirname "$NODE_BIN"):/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=AgentPay Agent Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${RUN_USER}
Group=${RUN_GROUP}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=APP_DIR=${APP_DIR}
Environment=PATH=${PATH_ENV}
ExecStart=${NODE_BIN} ${APP_DIR}/src/index.mjs
Restart=always
RestartSec=3
TimeoutStopSec=20
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager || true

echo "[agent] installed systemd unit: ${SERVICE_FILE}"
