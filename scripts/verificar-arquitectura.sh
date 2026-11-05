#!/usr/bin/env bash
# Regla inviolable (AGENTS.md §5): dominio/ no importa infraestructura, NestJS ni drivers.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOMINIO="$ROOT/apps/api/src/dominio"

PROHIBIDO="from ['\"](@nestjs/|@infraestructura/|@aplicacion/|\.\./+(\.\./+)*(infraestructura|aplicacion)/|pg['\"]|mysql2|mongodb|mongoose|ioredis|redis['\"]|typeorm|prisma|@prisma/)"

if grep -rEn "$PROHIBIDO" "$DOMINIO" --include='*.ts'; then
  echo "FALLA: dominio/ importa infraestructura, aplicación, NestJS o un driver." >&2
  exit 1
fi
echo "arquitectura: dominio/ limpio"
