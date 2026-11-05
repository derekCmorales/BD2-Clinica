#!/usr/bin/env bash
# Deja el repo listo para `docker compose up`: .env y keyfile de Mongo (ninguno se versiona).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo ".env creado desde .env.example"
fi

KEYFILE="$ROOT/infra/mongo/keyfile"
if [ ! -f "$KEYFILE" ]; then
  openssl rand -base64 756 > "$KEYFILE"
  echo "keyfile de Mongo generado"
fi
# mongod rechaza keyfiles legibles por grupo/otros.
chmod 400 "$KEYFILE"

echo "Entorno listo."
