#!/usr/bin/env bash
# Seeds sintéticos. Destructivos: vacían las tablas antes de insertar.
set -euo pipefail
source "$(dirname "$0")/_entorno.sh"

echo "==> Seeds PostgreSQL"
psql_super -q --single-transaction \
  < "$ROOT/apps/api/src/infraestructura/postgres/seeds/001_demo.sql"

echo "==> Seeds MySQL"
mysql_root "${MYSQL_DATABASE:-odontologia}" \
  < "$ROOT/apps/api/src/infraestructura/mysql/seeds/001_demo.sql"

if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx historiales-mongo; then
  echo "==> Seeds MongoDB"
  mongo_root < "$ROOT/apps/api/src/infraestructura/mongo/seeds/001_demo.js"
fi

if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx historiales-redis-pediatrico; then
  echo "==> Seeds Redis (pediátrico)"
  node "$ROOT/apps/api/scripts/seed-redis.mjs"
fi

echo "Seeds aplicados."
