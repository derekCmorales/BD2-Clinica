# Uso: source "$(dirname "$0")/_entorno.sh"
# Carga .env para que los scripts usen las mismas credenciales que Compose.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi
COMPOSE=(docker compose -f "$ROOT/docker-compose.yml")

psql_super() {
  "${COMPOSE[@]}" exec -T postgres \
    psql -v ON_ERROR_STOP=1 -U "${POSTGRES_SUPERUSER:-postgres}" -d "${POSTGRES_DB:-hospital}" "$@"
}

mysql_root() {
  "${COMPOSE[@]}" exec -T -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-mysql_root_dev}" mysql \
    mysql -uroot "$@"
}

mongo_root() {
  "${COMPOSE[@]}" exec -T mongo mongosh \
    -u "${MONGO_INITDB_ROOT_USERNAME:-mongo_root}" \
    -p "${MONGO_INITDB_ROOT_PASSWORD:-mongo_root_dev}" \
    --authenticationDatabase admin --quiet "$@"
}

redis_pediatrico() {
  "${COMPOSE[@]}" exec -T redis-pediatrico redis-cli --no-auth-warning \
    --user "${REDIS_ADMIN_USER:-redis_admin}" --pass "${REDIS_ADMIN_PASSWORD:-redis_admin_dev}" "$@"
}

redis_cache() {
  "${COMPOSE[@]}" exec -T redis-cache redis-cli --no-auth-warning \
    --user "${REDIS_CACHE_USER:-cache_app}" --pass "${REDIS_CACHE_PASSWORD:-cache_app_dev}" "$@"
}
