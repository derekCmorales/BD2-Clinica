#!/usr/bin/env bash
# Aplica en orden las migraciones NNN_*.sql que aún no están en schema_migrations.
# PostgreSQL: cada migración + su registro corren en UNA transacción (DDL transaccional).
# MySQL: el DDL hace commit implícito, así que una migración que falle a medias puede dejar
#        cambios parciales; se registra solo si terminó completa.
set -euo pipefail
source "$(dirname "$0")/_entorno.sh"

PG_DIR="$ROOT/apps/api/src/infraestructura/postgres/migrations"
MY_DIR="$ROOT/apps/api/src/infraestructura/mysql/migrations"
MY_DB="${MYSQL_DATABASE:-odontologia}"

echo "==> PostgreSQL (${POSTGRES_DB:-hospital})"
psql_super -q <<'SQL'
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version     VARCHAR(80) PRIMARY KEY,
  aplicada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Bases creadas antes de existir esta tabla: 001 ya estaba aplicada.
INSERT INTO public.schema_migrations (version)
SELECT '001_clinico'
WHERE to_regclass('clinico.paciente') IS NOT NULL
ON CONFLICT DO NOTHING;
SQL
for archivo in "$PG_DIR"/[0-9][0-9][0-9]_*.sql; do
  version="$(basename "$archivo" .sql)"
  aplicada=$(psql_super -tAc "SELECT 1 FROM public.schema_migrations WHERE version = '$version'")
  if [ "$aplicada" = "1" ]; then
    echo "   = $version"
    continue
  fi
  { cat "$archivo"; echo; echo "INSERT INTO public.schema_migrations (version) VALUES ('$version');"; } \
    | psql_super -q --single-transaction
  echo "   + $version"
done

echo "==> MySQL ($MY_DB)"
mysql_root "$MY_DB" <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(80) PRIMARY KEY,
  aplicada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO schema_migrations (version)
SELECT '001_clinico' FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'paciente';
SQL
for archivo in "$MY_DIR"/[0-9][0-9][0-9]_*.sql; do
  version="$(basename "$archivo" .sql)"
  aplicada=$(mysql_root -N "$MY_DB" -e "SELECT COUNT(*) FROM schema_migrations WHERE version = '$version'")
  if [ "${aplicada//[[:space:]]/}" = "1" ]; then
    echo "   = $version"
    continue
  fi
  mysql_root "$MY_DB" < "$archivo"
  mysql_root "$MY_DB" -e "INSERT INTO schema_migrations (version) VALUES ('$version')"
  echo "   + $version"
done

if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx historiales-mongo; then
  echo "==> MongoDB esquema"
  docker exec -i historiales-mongo mongosh \
    -u "${MONGO_INITDB_ROOT_USERNAME:-mongo_root}" \
    -p "${MONGO_INITDB_ROOT_PASSWORD:-mongo_root_dev}" \
    --authenticationDatabase admin --quiet \
    < "$ROOT/apps/api/src/infraestructura/mongo/migrations/001_esquema.js"
fi

echo "Migraciones al día."
