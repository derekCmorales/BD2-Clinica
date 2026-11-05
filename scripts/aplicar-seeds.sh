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

echo "Seeds aplicados."
