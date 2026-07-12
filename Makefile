.PHONY: dev build up down migrate seed test backend-shell frontend-shell

dev:
	docker compose up --build

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

migrate:
	docker compose run --rm backend alembic upgrade head

seed:
	docker compose run --rm backend python scripts/seed.py

test:
	docker compose run --rm backend pytest

backend-shell:
	docker compose exec backend bash

frontend-shell:
	docker compose exec frontend sh
