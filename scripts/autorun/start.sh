#!/usr/bin/env bash
# Start backend, frontend, or both
# Usage: ./start.sh [backend|frontend|all]
#   default: all

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/_src_/ims-frontend-source"

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
err()  { echo -e "${RED}[autorun]${NC} $1"; }

is_port_in_use() {
  lsof -ti:"$1" >/dev/null 2>&1
}

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    warn "Killing process(es) on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

start_backend() {
  log "Starting backend (port $BACKEND_PORT)..."

  if is_port_in_use "$BACKEND_PORT"; then
    warn "Port $BACKEND_PORT already in use"
    kill_port "$BACKEND_PORT"
  fi

  cd "$ROOT_DIR"
  npm run dev > "$ROOT_DIR/scripts/autorun/.backend.log" 2>&1 &
  local pid=$!
  echo "$pid" > "$SCRIPT_DIR/.backend.pid"

  # Wait for backend to be ready
  local retries=0
  while [ $retries -lt 30 ]; do
    if curl -sf http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
      ok "Backend running (pid $pid, port $BACKEND_PORT)"
      return 0
    fi
    retries=$((retries + 1))
    sleep 1
  done

  # Even if health check didn't respond, check if process is alive
  if kill -0 "$pid" 2>/dev/null; then
    warn "Backend started (pid $pid) but health check not responding yet — check .backend.log"
  else
    err "Backend failed to start — check scripts/autorun/.backend.log"
    return 1
  fi
}

start_frontend() {
  log "Starting frontend (port $FRONTEND_PORT)..."

  if [ ! -d "$FRONTEND_DIR/src" ]; then
    err "Frontend source not found at $FRONTEND_DIR/src"
    err "Run: scp frontend source from VPS first (see _dox_/13-VPS-SERVER-AUDIT.md)"
    return 1
  fi

  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log "Installing frontend dependencies (first run)..."
    cd "$FRONTEND_DIR" && npm install
  fi

  if is_port_in_use "$FRONTEND_PORT"; then
    warn "Port $FRONTEND_PORT already in use"
    kill_port "$FRONTEND_PORT"
  fi

  cd "$FRONTEND_DIR"
  BROWSER=none npm start > "$ROOT_DIR/scripts/autorun/.frontend.log" 2>&1 &
  local pid=$!
  echo "$pid" > "$SCRIPT_DIR/.frontend.pid"

  # Wait for frontend to be ready
  local retries=0
  while [ $retries -lt 60 ]; do
    if curl -sf http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
      ok "Frontend running (pid $pid, port $FRONTEND_PORT)"
      return 0
    fi
    retries=$((retries + 1))
    sleep 1
  done

  if kill -0 "$pid" 2>/dev/null; then
    warn "Frontend started (pid $pid) but not responding yet — check .frontend.log"
  else
    err "Frontend failed to start — check scripts/autorun/.frontend.log"
    return 1
  fi
}

TARGET="${1:-all}"

case "$TARGET" in
  backend)
    start_backend
    ;;
  frontend)
    start_frontend
    ;;
  all)
    start_backend
    start_frontend
    echo ""
    ok "All services started"
    ok "  Backend:  http://localhost:$BACKEND_PORT"
    ok "  Frontend: http://localhost:$FRONTEND_PORT"
    ok "  API Docs: http://localhost:$BACKEND_PORT/api-docs"
    ;;
  *)
    err "Usage: $0 [backend|frontend|all]"
    exit 1
    ;;
esac
