#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
APP_DIR=${APP_DIR:-$REPO_DIR}

cd "$APP_DIR"
exec node ./src/index.mjs
