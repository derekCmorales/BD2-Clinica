#!/usr/bin/env bash
# Demo de un comando: prepara entorno, levanta los cuatro motores, migra, siembra
# y arranca API + cliente. Ctrl+C detiene API y Vite (los contenedores siguen arriba).
set -euo pipefail
source "$(dirname "$0")/_entorno.sh"

pnpm preparar

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

echo "==> Migraciones y seeds sintéticos"
bash "$ROOT/scripts/aplicar-migraciones.sh"
bash "$ROOT/scripts/aplicar-seeds.sh"

export PERSISTENCIA=motores
trap 'kill 0' EXIT INT TERM

echo "==> API (motores reales) en http://localhost:3000/docs"
pnpm --filter @historiales/api start &
echo "==> Cliente en http://localhost:5173"
pnpm --filter @historiales/web exec vite --host 127.0.0.1 &

echo
echo "Clave de demostración: demo"
echo "Instituciones: hospital · odontologia · laboratorio · pediatrico"
echo "Ctrl+C para detener API y cliente."
wait
