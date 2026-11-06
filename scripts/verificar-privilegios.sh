#!/usr/bin/env bash
# Comprueba que cada institución use su propio usuario de app y que la auditoría
# sea append-only donde el motor permite expresarlo con privilegios.
set -euo pipefail
source "$(dirname "$0")/_entorno.sh"

fallas=0
ok() { echo "   ✓ $1"; }
falla() { echo "   ✗ $1" >&2; fallas=$((fallas + 1)); }

echo "==> PostgreSQL · hospital_app"
if "${COMPOSE[@]}" exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-hospital_app}" -d "${POSTGRES_DB:-hospital}" \
  -c "UPDATE clinico.auditoria_acceso SET recurso = 'alterado'" >/dev/null 2>&1; then
  falla "hospital_app puede hacer UPDATE sobre la auditoría"
else
  ok "auditoría append-only: UPDATE denegado"
fi
if "${COMPOSE[@]}" exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-hospital_app}" -d "${POSTGRES_DB:-hospital}" \
  -c "DELETE FROM clinico.auditoria_acceso" >/dev/null 2>&1; then
  falla "hospital_app puede hacer DELETE sobre la auditoría"
else
  ok "auditoría append-only: DELETE denegado"
fi

echo "==> MySQL · odontologia_app"
if "${COMPOSE[@]}" exec -T -e MYSQL_PWD="${MYSQL_PASSWORD:-odontologia_app_dev}" mysql \
  mysql -u "${MYSQL_USER:-odontologia_app}" "${MYSQL_DATABASE:-odontologia}" \
  -e "UPDATE auditoria_acceso SET recurso = 'alterado'" >/dev/null 2>&1; then
  falla "odontologia_app puede hacer UPDATE sobre la auditoría"
else
  ok "auditoría append-only: UPDATE denegado"
fi
if "${COMPOSE[@]}" exec -T -e MYSQL_PWD="${MYSQL_PASSWORD:-odontologia_app_dev}" mysql \
  mysql -u "${MYSQL_USER:-odontologia_app}" "${MYSQL_DATABASE:-odontologia}" \
  -e "DELETE FROM auditoria_acceso" >/dev/null 2>&1; then
  falla "odontologia_app puede hacer DELETE sobre la auditoría"
else
  ok "auditoría append-only: DELETE denegado"
fi

echo "==> MongoDB · laboratorio_app"
roles=$("${COMPOSE[@]}" exec -T mongo mongosh \
  -u "${MONGO_USER:-laboratorio_app}" -p "${MONGO_PASSWORD:-laboratorio_app_dev}" \
  --authenticationDatabase "${MONGO_DATABASE:-laboratorio}" --quiet \
  --eval "db.runCommand({connectionStatus:1}).authInfo.authenticatedUserRoles.map(r => r.role + '@' + r.db).join(',')" \
  | tail -1 | tr -d '[:space:]')
if [ "$roles" = "readWrite@${MONGO_DATABASE:-laboratorio}" ]; then
  ok "rol readWrite limitado a su base (sin dbAdmin ni root)"
else
  falla "rol inesperado en Mongo: $roles"
fi

echo "==> Redis · pediatrico_app"
salida=$("${COMPOSE[@]}" exec -T redis-pediatrico redis-cli --no-auth-warning \
  --user "${REDIS_PEDIATRICO_USER:-pediatrico_app}" --pass "${REDIS_PEDIATRICO_PASSWORD:-pediatrico_app_dev}" \
  FLUSHALL 2>&1 || true)
if echo "$salida" | grep -q "NOPERM"; then
  ok "FLUSHALL denegado por ACL"
else
  falla "pediatrico_app puede ejecutar FLUSHALL: $salida"
fi
salida=$("${COMPOSE[@]}" exec -T redis-pediatrico redis-cli --no-auth-warning \
  --user "${REDIS_PEDIATRICO_USER:-pediatrico_app}" --pass "${REDIS_PEDIATRICO_PASSWORD:-pediatrico_app_dev}" \
  CONFIG GET maxmemory 2>&1 || true)
if echo "$salida" | grep -q "NOPERM"; then
  ok "CONFIG denegado por ACL"
else
  falla "pediatrico_app puede ejecutar CONFIG: $salida"
fi

if [ "$fallas" -gt 0 ]; then
  echo "FALLAN $fallas comprobaciones de privilegios" >&2
  exit 1
fi
echo "privilegios: mínimo por institución verificado"
