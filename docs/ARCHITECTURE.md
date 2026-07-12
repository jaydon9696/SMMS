# Architecture

## Context

Phase 1 serves one mess and two actors:

- **Admin**: authenticated mess owner.
- **Customer**: unauthenticated holder of a table or standing-order QR.

Kitchen, waiter, employee and member identities are deliberately absent.

## Runtime boundaries

### Edge: Nginx

Nginx is the public entry point. It:

- proxies pages and BFF calls to Next.js;
- proxies versioned APIs and WebSockets to FastAPI;
- applies public-order rate limiting;
- forwards original request metadata;
- supports WebSocket upgrades;
- hides server version details.

### Web: Next.js

Next.js owns presentation and browser session handling.

- Customer routes are deep-linkable from QR codes.
- Admin and customer features are separated by route and feature modules.
- TanStack Query owns remote cache and polling.
- The cart is local to the scanned order source.
- The login route handler exchanges credentials for a backend JWT and stores it
  in an HTTP-only, same-site cookie.
- BFF route handlers forward the JWT server-side. Client JavaScript never reads it.
- `proxy.ts` only provides optimistic navigation redirects. FastAPI remains the
  authorization authority.

### Application: FastAPI

The backend is a modular monolith with explicit layers:

```text
route -> schema -> service -> repository -> SQLAlchemy model
```

- Routes handle transport and actor dependencies.
- Schemas validate external data and define response contracts.
- Services own transactional workflows and state transitions.
- Repositories own reusable, tenant-scoped queries.
- Models define persistence and database invariants.

The monolith minimizes Phase 1 operational complexity while module boundaries
allow future extraction of ordering, menu, billing or notification services.

### Data: PostgreSQL

PostgreSQL is the system of record. Foreign keys, unique constraints, check
constraints and row locks protect invariants that cannot safely live only in
application code.

### Images: Cloudinary

Authenticated admins can upload JPEG, PNG or WebP menu images up to 5 MB.
FastAPI uploads into a tenant-specific Cloudinary folder and stores only the
resulting secure URL in PostgreSQL.

## Authentication flow

```text
Browser -> POST /api/session/login
Next.js -> POST /api/v1/auth/login
FastAPI -> signed access token
Next.js -> Set-Cookie smms_token (HttpOnly, SameSite=Strict)
Browser -> /api/backend/*
Next.js -> Authorization: Bearer <token> -> FastAPI
```

Admin API access always resolves an active user and scopes work to `user.mess_id`.

## Order creation

```text
create(mess_id, payload, idempotency_key):
  existing = orders.find(mess_id, idempotency_key)
  if existing: return existing
  menu_items = lock current available catalog view
  table = validate active tenant table when source == table
  total = sum(database_price * requested_quantity)
  snapshot each item name, price, quantity and note
  insert order + initial pending history in one transaction
  commit
  publish admin event
```

The browser total is advisory. The backend always recomputes it.

## Order state machine

```text
pending -> accepted -> preparing -> ready -> completed
   \           \            \
    +----------+-------------+-> cancelled
```

Status commands lock the order row with `SELECT ... FOR UPDATE`, validate the
transition, append status history and commit before publishing. Invalid jumps
return HTTP 409.

## Real-time behavior

- Customer tracking opens `/ws/orders/{public_id}`.
- The initial state and reconnect recovery use REST.
- Polling every 15 seconds is a fallback if WebSockets are disrupted.
- Admin uses frequent bounded polling in Phase 1.

The in-memory connection manager intentionally sits behind a small interface.
Before running multiple backend workers, replace it with:

1. a transactional outbox written in the order transaction;
2. a publisher process;
3. Redis or a durable broker for cross-worker fan-out;
4. event sequence/version fields for replay and stale-event rejection.

## Scaling path

1. Add `branches` below `messes` and make branch context explicit.
2. Add tenant slug/domain resolution for public and login routes.
3. Move JWT signing to asymmetric keys with rotation and refresh sessions.
4. Introduce Redis/outbox real-time delivery.
5. Add read replicas/materialized reporting views when report volume requires it.
6. Extract modules only when independent scaling or team ownership justifies it.

## Operational assumptions

- Phase 1 runs one FastAPI worker because WebSocket connections are in memory.
- UTC is stored and used for current report boundaries. A mess timezone field
  should be added before serving multiple regions.
- Seed credentials are development conveniences, not production provisioning.
- PostgreSQL and Cloudinary require independent backup/retention policies.
