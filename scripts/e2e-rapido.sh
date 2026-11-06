#!/usr/bin/env bash
# e2e sin Docker: los cuatro adaptadores en memoria. Para desarrollo local.
set -euo pipefail
source "$(dirname "$0")/_entorno.sh"
export PERSISTENCIA=memoria
pnpm --filter @historiales/e2e test "$@"
