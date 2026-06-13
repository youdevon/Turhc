#!/bin/sh
set -e

PRISMA=/app/prisma-cli/node_modules/.bin/prisma
TSX=/app/prisma-cli/node_modules/.bin/tsx

echo "Running iMgMT database migrations..."
"$PRISMA" migrate deploy --schema=/app/prisma/schema.prisma

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "Running iMgMT database seed..."
  NODE_PATH=/app/prisma-cli/node_modules "$TSX" /app/prisma/seed.ts
fi

exec "$@"
