#!/bin/sh
set -e

PRISMA=/app/prisma-cli/node_modules/.bin/prisma
TSX=/app/prisma-cli/node_modules/.bin/tsx
SCHEMA=/app/prisma/schema.prisma

run_migrations() {
  echo "Running database migrations..."
  set +e
  output=$("$PRISMA" migrate deploy --schema="$SCHEMA" 2>&1)
  status=$?
  set -e
  echo "$output"

  if [ "$status" -eq 0 ]; then
    return 0
  fi

  if echo "$output" | grep -q 'P3005'; then
    echo "Existing database without migration history — baselining migrations..."
    for dir in /app/prisma/migrations/*/; do
      [ -d "$dir" ] || continue
      name=$(basename "$dir")
      "$PRISMA" migrate resolve --applied "$name" --schema="$SCHEMA"
    done
    "$PRISMA" migrate deploy --schema="$SCHEMA"
    return 0
  fi

  return 1
}

run_migrations

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "Running database seed..."
  set +e
  NODE_PATH=/app/prisma-cli/node_modules "$TSX" /app/prisma/seed.ts
  seed_status=$?
  set -e
  if [ "$seed_status" -ne 0 ]; then
    echo "Warning: seed exited with status $seed_status (database may already be populated). Continuing startup."
  fi
fi

exec "$@"
