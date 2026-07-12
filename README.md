# Smart Mess Management System (SMMS)

A production-ready, QR-based ordering platform for small messes, hostels, canteens and restaurants.

## Architecture

This is a modular monorepo:

```
SMMS/
├── frontend/       Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui
├── backend/        FastAPI + Python 3.13 + SQLAlchemy + Alembic
├── docker/         Docker Compose + service Dockerfiles
├── nginx/          Reverse proxy config
├── scripts/        Seed and utility scripts
├── docs/           Architecture, API, schema and deployment docs
└── README.md
```

## Quick Start

1. Copy `.env.example` to `.env` and set `SECRET_KEY` and `ADMIN_PASSWORD`.
2. Run `docker compose up --build`.
3. Open `http://localhost`.

Default admin credentials are seeded from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Development

See `docs/development.md`.

## Deployment

See `docs/deployment.md`.

## Testing

Run `make test`.

## Documentation

- `docs/architecture.md`
- `docs/database_schema.md`
- `docs/api_endpoints.md`
- `docs/development.md`
- `docs/deployment.md`
- `docs/testing.md`
- `docs/future_enhancements.md`
