#!/usr/bin/env bash
# TTPForge startup script for Linux (Debian/Ubuntu).
#
# Usage:
#   ./start.sh            # Start the application
#   ./start.sh --check    # Verify requirements
#   ./start.sh --init     # First-time setup
#   ./start.sh --stop     # Stop containers

set -euo pipefail

# ── helpers ───────────────────────────────────────────────────────────────────

ok()   { printf "  \e[32m[OK] \e[0m %s\n" "$*"; }
fail() { printf "  \e[31m[!!] \e[0m %s\n" "$*"; }
info() { printf "  \e[36m[-]  \e[0m %s\n" "$*"; }
head() { printf "\n\e[97m%s\e[0m\n" "$*"; }

port_free() {
    local port=$1
    if command -v ss &>/dev/null; then
        ! ss -tlnH "sport = :${port}" 2>/dev/null | grep -q ":${port}"
    elif command -v netstat &>/dev/null; then
        ! netstat -tlnp 2>/dev/null | grep -q ":${port} "
    else
        # fallback: try binding
        (echo >/dev/tcp/localhost/"$port") 2>/dev/null && return 1 || return 0
    fi
}

get_compose_cmd() {
    if docker compose version &>/dev/null 2>&1; then
        echo "docker compose"
    elif command -v docker-compose &>/dev/null; then
        echo "docker-compose"
    else
        echo ""
    fi
}

run_compose() {
    local cmd
    cmd=$(get_compose_cmd)
    if [[ -z "$cmd" ]]; then
        fail "Docker Compose not found."
        exit 1
    fi
    # shellcheck disable=SC2086
    $cmd $@
}

# ── --check ───────────────────────────────────────────────────────────────────

do_check() {
    head "=== Requirement Check ==="
    local ok=true

    # 1. Docker CLI
    if command -v docker &>/dev/null; then
        ok "Docker CLI found: $(docker --version)"
    else
        fail "Docker CLI not found. Install: https://docs.docker.com/engine/install/ubuntu/"
        ok=false
    fi

    # 2. Docker daemon
    if docker info &>/dev/null 2>&1; then
        ok "Docker daemon is running"
    else
        fail "Docker daemon is not running. Start it with: sudo systemctl start docker"
        ok=false
    fi

    # 3. Docker Compose
    local compose_cmd
    compose_cmd=$(get_compose_cmd)
    if [[ -n "$compose_cmd" ]]; then
        if [[ "$compose_cmd" == "docker compose" ]]; then
            ok "Docker Compose found ($compose_cmd): $(docker compose version)"
        else
            ok "Docker Compose found ($compose_cmd): $(docker-compose --version)"
        fi
    else
        fail "Docker Compose not found. Install Docker Engine with the Compose plugin."
        ok=false
    fi

    # 4. docker-compose.yml
    if [[ -f "docker-compose.yml" ]]; then
        ok "docker-compose.yml found in current directory"
    else
        fail "docker-compose.yml not found. Run this script from the project root."
        ok=false
    fi

    # 5. Port availability
    local ports=(5000 5173 5432)
    local names=("Backend  (Flask)     " "Frontend (Vite)      " "Database (PostgreSQL)")
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${names[$i]}
        if port_free "$port"; then
            ok "Port ${port} (${name}) is available"
        else
            fail "Port ${port} (${name}) is already in use"
            ok=false
        fi
    done

    echo ""
    if [[ "$ok" == "true" ]]; then
        printf "\e[32mAll checks passed. Ready to run.\e[0m\n"
    else
        printf "\e[31mOne or more checks failed. Resolve the issues above before starting.\e[0m\n"
    fi

    [[ "$ok" == "true" ]]
}

# ── --init ────────────────────────────────────────────────────────────────────

do_init() {
    head "=== TTPForge — First-Time Setup ==="

    info "Running requirement checks..."
    if ! do_check; then
        printf "\n\e[31mSetup aborted: fix the issues above first.\e[0m\n"
        exit 1
    fi

    head "--- Building and starting containers ---"
    run_compose up --build -d

    head "--- Waiting for backend to be ready ---"
    local timeout=120
    local elapsed=0
    local interval=4
    local ready=false

    while [[ $elapsed -lt $timeout ]]; do
        if curl -sf --max-time 3 "http://localhost:5000/docs/api/openapi.json" &>/dev/null; then
            ready=true
            break
        fi
        printf "  \e[90mWaiting... (%d/%d s)\e[0m\n" "$elapsed" "$timeout"
        sleep "$interval"
        elapsed=$(( elapsed + interval ))
    done

    if [[ "$ready" != "true" ]]; then
        fail "Backend did not become ready within ${timeout} seconds."
        info "Check logs with: docker compose logs backend"
        exit 1
    fi

    ok "Backend is ready."

    head "--- Verifying default admin account ---"
    local http_code
    http_code=$(curl -sf --max-time 5 -o /dev/null -w "%{http_code}" \
        -X POST "http://localhost:5000/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin"}' 2>/dev/null || echo "000")

    if [[ "$http_code" == "200" ]]; then
        ok "Default admin account confirmed (admin / admin)"
    else
        fail "Could not verify admin account. Check: docker compose logs backend"
    fi

    echo ""
    printf "\e[32m========================================\e[0m\n"
    printf "\e[32m  TTPForge is ready!\e[0m\n"
    printf "\e[32m========================================\e[0m\n"
    echo ""
    printf "  \e[36mApp:      http://localhost:5173\e[0m\n"
    printf "  \e[36mAPI docs: http://localhost:5000/docs/api\e[0m\n"
    echo ""
    printf "  Default credentials:\n"
    printf "    Admin:     admin / admin\n"
    printf "    Red team:  redteam / redteam\n"
    printf "    Blue team: blueteam / blueteam\n"
    echo ""
}

# ── --stop ────────────────────────────────────────────────────────────────────

do_stop() {
    head "=== Stopping TTPForge ==="
    run_compose down
    ok "All containers stopped."
}

# ── default start ─────────────────────────────────────────────────────────────

do_start() {
    head "=== Starting TTPForge ==="

    if [[ ! -f "docker-compose.yml" ]]; then
        fail "docker-compose.yml not found. Run this script from the project root."
        exit 1
    fi

    run_compose up -d

    echo ""
    printf "  \e[36mApp:      http://localhost:5173\e[0m\n"
    printf "  \e[36mAPI docs: http://localhost:5000/docs/api\e[0m\n"
    echo ""
    info "View logs with: docker compose logs -f"
}

# ── dispatch ──────────────────────────────────────────────────────────────────

case "${1:-}" in
    --check) do_check ;;
    --init)  do_init  ;;
    --stop)  do_stop  ;;
    "")      do_start ;;
    *)
        printf "Unknown option: %s\n" "$1"
        printf "Usage: %s [--check | --init | --stop]\n" "$0"
        exit 1
        ;;
esac
