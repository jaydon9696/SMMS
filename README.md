# Smart Mess Management System

SMMS digitizes table and standing orders for a single mess while preserving a
tenant boundary for future multi-mess SaaS operation. Customers scan a QR code,
build a cart, place an idempotent order and track it live. The owner manages the
menu, queue, tables and daily reports from one responsive dashboard.

## Phase 1 capabilities

- Admin login with Argon2 password hashing, JWT APIs and HTTP-only browser sessions.
- Category and menu-item management, availability controls and Cloudinary images.
- Unique QR links for every table plus a separate standing-order QR.
- Persistent customer cart, item/order notes and cash or counter payment selection.
- Server-authoritative pricing and idempotent checkout.
- Pending → accepted → preparing → ready → completed workflow.
- Customer WebSocket tracking with polling fallback.
- Live admin order board, dashboard metrics, table state and daily reports.
- PostgreSQL migrations, idempotent seed data and tenant-scoped data access.
- Docker Compose deployment with Nginx, health checks and public API rate limiting.

## Architecture

```text
Browser
  ├─ pages / Next.js BFF ── HTTP-only JWT cookie
  ├─ public WebSocket ──────────────────────────────┐
  └─ QR links                                       │
                                                   ▼
Nginx ── Next.js 16 ── FastAPI ── SQLAlchemy ── PostgreSQL 17
                         │
                         └─ Cloudinary image storage
```

The backend is a modular monolith. `mess_id` is the tenant boundary on all
business aggregates, but Phase 1 resolves one default mess for public routes.
See [architecture](docs/ARCHITECTURE.md) and
[database design](docs/DATABASE.md).

## Quick start

Requirements:

- Docker Engine 27+
- Docker Compose v2

```bash
cp .env.example .env
# Replace SECRET_KEY, POSTGRES_PASSWORD and ADMIN_PASSWORD.
docker compose up --build -d
docker compose ps
```

Open:

- Application: `http://localhost`
- Owner login: `http://localhost/admin/login`
- Standing order: `http://localhost/order/standing`
- Table order: `http://localhost/order/table/1`
- Swagger UI: `http://localhost/docs`
- Health check: `http://localhost/health`

The Compose development defaults seed `admin@smms.local` with
`ChangeMe123!`. Never use these defaults outside local development.

## Local development

### Backend

Python 3.13 is required. The Docker workflow avoids dependence on the host Python.

```bash
cd backend
python3.13 -m venv .venv
. .venv/bin/activate
pip install -e '.[dev]'
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload
```

### Frontend

Node `>=20.19.0` is required.

```bash
cd frontend
npm ci
npm run dev
```

Set `BACKEND_INTERNAL_URL=http://localhost:8000/api/v1` when running the
frontend outside Compose. Client REST calls use same-origin BFF routes; public
WebSockets use `NEXT_PUBLIC_WS_URL`.

## Repository structure

```text
.
├── backend/                 FastAPI modular monolith
│   ├── alembic/             Database migration environment
│   ├── app/
│   │   ├── api/             Versioned REST and WebSocket routes
│   │   ├── core/            Settings, logging and security
│   │   ├── db/              SQLAlchemy base and sessions
│   │   ├── middleware/      Request/security headers
│   │   ├── models/          Persistent domain model
│   │   ├── repositories/    Tenant-scoped persistence queries
│   │   ├── schemas/         API validation/serialization
│   │   ├── services/        Transactional business workflows
│   │   └── websocket/       Real-time connection boundary
│   ├── scripts/             Container entrypoint and seed
│   └── tests/               Core backend tests
├── frontend/                Next.js App Router application
│   ├── app/                 Pages, route handlers and route groups
│   ├── components/          Shared and shadcn/ui components
│   ├── contexts/            Query, theme and cart state
│   ├── features/            Customer and admin modules
│   ├── services/            Typed API boundary
│   └── types/               Domain contracts
├── docs/                    Architecture, API, database and operations
├── nginx/                   Edge proxy configuration
├── scripts/                 Project-level verification tools
└── docker-compose.yml       PostgreSQL, backend, frontend and Nginx
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | `development`, `test` or `production` |
| `POSTGRES_DB` | PostgreSQL database |
| `POSTGRES_USER` | PostgreSQL application user |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `SECRET_KEY` | JWT signing secret, minimum 32 characters |
| `FRONTEND_URL` | Allowed browser origin |
| `ADMIN_EMAIL` | Seed admin email |
| `ADMIN_PASSWORD` | Seed admin password |
| `ADMIN_NAME` | Seed admin display name |
| `CLOUDINARY_URL` | Cloudinary API URL for menu image uploads |
| `NEXT_PUBLIC_WS_URL` | Public WebSocket API base URL |
| `HTTP_PORT` | Host port published by Nginx |

`NEXT_PUBLIC_*` values are embedded during the frontend image build. Rebuild
the frontend after changing them.

## Verification

```bash
./scripts/verify.sh
```

The script runs backend lint, strict mypy and unit tests in Python 3.13, then
frontend lint, type checking, audit and production build. Full API and manual
test procedures are in [testing](docs/TESTING.md).

## Production deployment

Follow [the Ubuntu VPS deployment guide](docs/DEPLOYMENT.md). At minimum:

1. Replace every development credential.
2. Set the public HTTPS and WSS origins.
3. Configure Cloudinary.
4. Put TLS termination in front of the Compose Nginx service.
5. Configure PostgreSQL backups and off-host monitoring.

## Further documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database schema](docs/DATABASE.md)
- [API and WebSockets](docs/API.md)
- [Testing](docs/TESTING.md)
- [Ubuntu deployment](docs/DEPLOYMENT.md)
- [Future roadmap](docs/FUTURE.md)
