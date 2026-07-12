# Architecture

SMMS is a modular monorepo designed for a single mess in Phase 1 and future SaaS multi-tenancy.

## Backend

- `app/main.py`: FastAPI application factory.
- `app/api/`: versioned routers (`/api/v1/...`).
- `app/models/`: SQLAlchemy declarative models.
- `app/schemas/`: Pydantic request/response models.
- `app/services/`: business logic orchestration.
- `app/repositories/`: data access abstraction.
- `app/core/`: configuration, security, logging.
- `app/db/`: engine, session, base.
- `app/websocket/`: connection manager and broadcasting.
- `app/middleware/`: rate limiting, CORS, etc.
- `alembic/`: migrations.
- `tests/`: pytest suite.

## Frontend

- `app/`: Next.js App Router.
  - `(admin)/`: admin dashboard route group.
  - `login/`: admin login.
  - `order/`: customer-facing QR order and tracking pages.
- `components/`: reusable UI and feature components.
- `services/`: API client.
- `hooks/`: custom React hooks.
- `contexts/`: auth and theme providers.
- `types/`: shared TypeScript types.

## Future-Proofing

- Foreign keys, audit fields (`created_at`, `updated_at`, `deleted_at`) and soft deletes support SaaS multi-tenancy, inventory, billing, employee management and analytics.
- WebSocket manager is extensible for kitchen display, push notifications and WhatsApp integrations.
- Payment abstraction supports Razorpay/UPI additions later.
