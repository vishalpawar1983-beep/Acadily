#!/usr/bin/env bash
# Stop backend, frontend, or both
# Usage: ./stop.sh [backend|frontend|all]
#   default: all

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

BACKEND_PORT=3001
FRONTEND_PORT=3003

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[autorun]${NC} $1"; }
ok()   { echo -e "${GREEN}[autorun]${NC} $1"; }
warn() { echo -e "${YELLOW}[autorun]${NC} $1"; }

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
    return 0
  fi
  return 1
}

stop_backend() {
  log "Stopping backend (port $BACKEND_PORT)..."

  # Try PID file first
  if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    local pid
    pid=$(cat "$SCRIPT_DIR/.backend.pid")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      # Force kill if still alive
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$SCRIPT_DIR/.backend.pid"
  fi

  # Also kill anything on the port
  if kill_port "$BACKEND_PORT"; then
    ok "Backend stopped"
  else
    ok "Backend was not running"
  fi
}

stop_frontend() {
  log "Stopping frontend (port $FRONTEND_PORT)..."

  # Try PID file first
  if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    local pid
    pid=$(cat "$SCRIPT_DIR/.frontend.pid")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$SCRIPT_DIR/.frontend.pid"
  fi

  # Also kill anything on the port
  if kill_port "$FRONTEND_PORT"; then
    ok "Frontend stopped"
  else
    ok "Frontend was not running"
  fi
}

TARGET="${1:-all}"

case "$TARGET" in
  backend)
    stop_backend
    ;;
  frontend)
    stop_frontend
    ;;
  all)
    stop_backend
    stop_frontend
    ok "All services stopped"
    ;;
  *)
    echo -e "${RED}[autorun]${NC} Usage: $0 [backend|frontend|all]"
    exit 1
    ;;
esac
