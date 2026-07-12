#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

docker run --rm --user root --entrypoint sh \
  -v "$ROOT_DIR/backend:/app" \
  -w /app \
  python:3.13.5-slim-bookworm \
  -c "pip install --disable-pip-version-check -q -e '.[dev]' &&
      ruff check app scripts tests &&
      mypy app scripts &&
      pytest -q"

cd "$ROOT_DIR/frontend"
npm ci
npm run lint
npm run typecheck
npm audit --audit-level=moderate
npm run build
