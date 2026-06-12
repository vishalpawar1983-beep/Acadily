#!/usr/bin/env bash
# Restart backend, frontend, or both (stop + start)
# Usage: ./restart.sh [backend|frontend|all]
#   default: all

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-all}"

"$SCRIPT_DIR/stop.sh" "$TARGET"
"$SCRIPT_DIR/start.sh" "$TARGET"
