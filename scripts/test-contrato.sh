#!/usr/bin/env bash
# Suite de contrato: levanta los cuatro motores, espera salud, migra y corre los escenarios.
# Requiere Docker. No aplica seeds: cada escenario crea su propio paciente sintético.
set -euo pipefail
source "$(dirname "$0")/_entorno.sh"

echo "==> Levantando motores"
# `mongo-init-replica` es un contenedor de una sola ejecución: incluirlo en --wait
# hace que Compose lo reporte como fallo aunque haya terminado con código 0.
"${COMPOSE[@]}" up -d --wait postgres mysql mongo redis-pediatrico redis-cache
"${COMPOSE[@]}" up -d mongo-init-replica

echo "==> Esperando replica set de MongoDB"
for intento in $(seq 1 30); do
  estado=$("${COMPOSE[@]}" exec -T mongo mongosh \
    -u "${MONGO_INITDB_ROOT_USERNAME:-mongo_root}" \
    -p "${MONGO_INITDB_ROOT_PASSWORD:-mongo_root_dev}" \
    --authenticationDatabase admin --quiet \
    --eval "try { rs.status().ok } catch (e) { 0 }" 2>/dev/null | tail -1 | tr -d '[:space:]')
  if [ "$estado" = "1" ]; then
    echo "   replica set listo"
    break
  fi
  if [ "$intento" = "30" ]; then
    echo "FALLA: el replica set de MongoDB no respondió" >&2
    exit 1
  fi
  sleep 2
done

echo "==> Migraciones"
bash "$ROOT/scripts/aplicar-migraciones.sh"

echo "==> Escenarios de contrato"
pnpm --filter @historiales/api test:contrato
