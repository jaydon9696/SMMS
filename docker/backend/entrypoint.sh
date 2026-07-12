#!/bin/sh
set -e

# Run Alembic migrations if a database URL is configured.
if [ -n "$DATABASE_URL" ]; then
    alembic upgrade head
fi

exec "$@"
