#!/usr/bin/env bash
# ============================================================
#  AutoLog — Script de inicio de desarrollo
#  Levanta Backend (Django) y Frontend (Angular) juntos.
#  Uso: bash start.sh
#  Ctrl+C detiene ambos procesos.
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/BACKEND"
FRONTEND_DIR="$SCRIPT_DIR/FRONTEND"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # sin color

log()    { echo -e "${GREEN}[AutoLog]${NC} $*"; }
warn()   { echo -e "${YELLOW}[AutoLog]${NC} $*"; }
error()  { echo -e "${RED}[AutoLog]${NC} $*"; }

# PIDs de los procesos hijos
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    warn "Deteniendo procesos..."
    [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && log "Backend detenido."
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && log "Frontend detenido."
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── Validaciones previas ─────────────────────────────────────
if [ ! -d "$BACKEND_DIR" ]; then
    error "No se encontró el directorio BACKEND en: $BACKEND_DIR"
    exit 1
fi
if [ ! -d "$FRONTEND_DIR" ]; then
    error "No se encontró el directorio FRONTEND en: $FRONTEND_DIR"
    exit 1
fi

# ── Detectar Python (con o sin virtualenv) ───────────────────
PYTHON=""
VENV_CANDIDATES=(
    "$BACKEND_DIR/venv/Scripts/python"
    "$BACKEND_DIR/.venv/Scripts/python"
    "$BACKEND_DIR/venv/bin/python"
    "$BACKEND_DIR/.venv/bin/python"
    "$SCRIPT_DIR/venv/Scripts/python"
    "$SCRIPT_DIR/.venv/Scripts/python"
    "$SCRIPT_DIR/venv/bin/python"
    "$SCRIPT_DIR/.venv/bin/python"
)

for candidate in "${VENV_CANDIDATES[@]}"; do
    if [ -f "$candidate" ]; then
        PYTHON="$candidate"
        log "Virtualenv encontrado: $candidate"
        break
    fi
done

if [ -z "$PYTHON" ]; then
    PYTHON="python"
    warn "No se encontró virtualenv. Usando Python del sistema: $(which python 2>/dev/null || echo 'no encontrado')"
fi

# ── Iniciar Backend ──────────────────────────────────────────
log "Iniciando Backend Django en http://127.0.0.1:8000 ..."
(
    cd "$BACKEND_DIR"
    "$PYTHON" manage.py runserver 2>&1 | sed "s/^/$(printf '\033[0;34m')[BACKEND]$(printf '\033[0m') /"
) &
BACKEND_PID=$!

# Pequeña pausa para detectar si el backend falla de inmediato
sleep 2
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    error "El backend no pudo iniciarse. Revisá los logs arriba."
    exit 1
fi

# ── Iniciar Frontend ─────────────────────────────────────────
log "Iniciando Frontend Angular en http://localhost:4200 ..."
(
    cd "$FRONTEND_DIR"
    npm start 2>&1 | sed "s/^/$(printf '\033[0;32m')[FRONTEND]$(printf '\033[0m') /"
) &
FRONTEND_PID=$!

sleep 2
if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    error "El frontend no pudo iniciarse. Revisá los logs arriba."
    kill "$BACKEND_PID" 2>/dev/null
    exit 1
fi

echo ""
log "============================================"
log "  AutoLog corriendo:"
log "  Backend  →  http://127.0.0.1:8000"
log "  Frontend →  http://localhost:4200"
log "  Presioná Ctrl+C para detener todo."
log "============================================"
echo ""

# Esperar hasta que uno de los dos procesos termine
wait "$BACKEND_PID" "$FRONTEND_PID"
