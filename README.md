# Smart Mess Management System (SMMS)

A production-ready, QR-based ordering platform for small messes, hostels, canteens and restaurants.

## Architecture

Monorepo layout:

```
smart-mess-system/
├── frontend/        Next.js 15 + React + TypeScript + Tailwind + shadcn/ui
├── backend/         FastAPI + Python 3.13 + SQLAlchemy + Alembic
├── docker/          Docker Compose + service Dockerfiles
├── nginx/           Reverse proxy config
├── scripts/         Seed and utility scripts
├── docs/            Architecture, API, schema and deployment docs
└── README.md
```

## Quick Start

1. Copy `.env.example` to `.env` and fill the values.
2. Run `docker compose up --build`.
3. Visit `http://localhost`.

Admin seed credentials are created from `ADMIN_EMAIL`/`ADMIN_PASSWORD` environment variables.

## Development

See `docs/development.md`.

## Deployment

See `docs/deployment.md`.
