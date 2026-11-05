#!/usr/bin/env bash
# Usuario de aplicación del Hospital (privilegios mínimos). Credenciales desde .env vía Compose.
# Se ejecuta solo en el primer arranque del volumen. Los GRANT sobre tablas viven en las migraciones.
set -euo pipefail

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v app_user="$APP_DB_USER" -v app_password="$APP_DB_PASSWORD" -v db="$POSTGRES_DB" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'app_user') \gexec

-- Nadie más que el usuario de app (y el superusuario) se conecta a la base del hospital.
SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', :'db') \gexec
SELECT format('GRANT CONNECT, TEMPORARY ON DATABASE %I TO %I', :'db', :'app_user') \gexec
SQL
