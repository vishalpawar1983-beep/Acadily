#!/usr/bin/env bash
# Check status of backend and frontend
# Usage: ./status.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

BACKEND_PORT=3001
FRONTEND_PORT=3003

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

check_service() {
  local name=$1
  local port=$2
  local pid_file="$SCRIPT_DIR/.$3.pid"

  local pid=""
  if [ -f "$pid_file" ]; then
    pid=$(cat "$pid_file")
  fi

  local port_pids
  port_pids=$(lsof -ti:"$port" 2>/dev/null || true)

  if [ -n "$port_pids" ]; then
    echo -e "${GREEN}●${NC} $name  port=$port  pid=$port_pids"

    # Health check for backend
    if [ "$port" = "$BACKEND_PORT" ]; then
      local health
      health=$(curl -sf http://localhost:$port/health 2>/dev/null || echo "unreachable")
      echo "  health: $health"
    fi
  else
    echo -e "${RED}○${NC} $name  port=$port  (not running)"
  fi
}

echo ""
echo -e "${CYAN}Flex Academy Portal — Service Status${NC}"
echo "─────────────────────────────────────"
check_service "Backend " "$BACKEND_PORT" "backend"
check_service "Frontend" "$FRONTEND_PORT" "frontend"
echo ""
