#!/usr/bin/env bash
# Reconstruye el read model del Hospital desde clinico.eventos.
# Conserva paciente, usuario y auditoría (la auditoría no es una proyección).
set -euo pipefail
source "$(dirname "$0")/_entorno.sh"

echo "==> Limpiando tablas derivadas del Hospital"
psql_super -q -c "
  TRUNCATE TABLE
    clinico.proyeccion_aplicada,
    clinico.receta,
    clinico.diagnostico,
    clinico.consulta,
    clinico.cita,
    clinico.expediente
  CASCADE;
"

echo "==> Compilando API"
pnpm --filter @historiales/api build

echo "==> Reproyectando desde clinico.eventos"
PERSISTENCIA=motores node "$ROOT/apps/api/dist/reproyectar.js"
