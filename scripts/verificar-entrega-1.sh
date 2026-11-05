#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_entorno.sh"
cd "$ROOT"

echo "==> Health containers"
"${COMPOSE[@]}" ps

echo "==> Migraciones aplicadas"
psql_super -c "SELECT version, aplicada_en FROM public.schema_migrations ORDER BY version;"
mysql_root "${MYSQL_DATABASE:-odontologia}" -e "SELECT version, aplicada_en FROM schema_migrations ORDER BY version;"

echo "==> Conteo Hospital (Postgres)"
psql_super -c \
  "SELECT 'pacientes' AS entidad, count(*) FROM clinico.paciente
   UNION ALL SELECT 'consultas', count(*) FROM clinico.consulta
   UNION ALL SELECT 'diagnosticos', count(*) FROM clinico.diagnostico;"

echo "==> Conteo Odontología (MySQL)"
mysql_root -N -e \
  "SELECT 'pacientes', COUNT(*) FROM odontologia.paciente
   UNION ALL SELECT 'piezas', COUNT(*) FROM odontologia.pieza_dental
   UNION ALL SELECT 'procedimientos', COUNT(*) FROM odontologia.procedimiento_dental;"

echo "==> Privilegios mínimos"
psql_super -tAc "SELECT 'hospital_app auditoria_acceso: ' || string_agg(privilege_type, ',' ORDER BY privilege_type)
                 FROM information_schema.role_table_grants
                 WHERE grantee = '${POSTGRES_USER:-hospital_app}' AND table_name = 'auditoria_acceso';"
if mysql_root -N -e "SHOW GRANTS FOR '${MYSQL_USER:-odontologia_app}'@'%'" | grep -q 'ALL PRIVILEGES'; then
  echo "FALLA: ${MYSQL_USER:-odontologia_app} conserva ALL PRIVILEGES" >&2
  exit 1
fi

echo "==> Redis pediátrico (registro)"
redis_pediatrico CONFIG GET appendonly | paste -sd' ' -
redis_pediatrico CONFIG GET appendfsync | paste -sd' ' -

echo "==> Redis caché"
redis_cache ping
redis_cache ACL WHOAMI

echo "verificar-entrega-1: OK"
