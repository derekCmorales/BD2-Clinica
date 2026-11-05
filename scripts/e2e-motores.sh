#!/usr/bin/env bash
# e2e contra los cuatro motores reales. Requiere Docker.
set -euo pipefail
source "$(dirname "$0")/_entorno.sh"

echo "==> Levantando motores"
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
    break
  fi
  if [ "$intento" = "30" ]; then
    echo "FALLA: el replica set de MongoDB no respondió" >&2
    exit 1
  fi
  sleep 2
done

echo "==> Migraciones y seeds"
bash "$ROOT/scripts/aplicar-migraciones.sh"
bash "$ROOT/scripts/aplicar-seeds.sh"

echo "==> Playwright contra motores"
export PERSISTENCIA=motores
pnpm --filter @historiales/e2e test "$@"
