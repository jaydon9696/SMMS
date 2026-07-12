# Database schema

## Tenant boundary

`messes` is the root aggregate. Users, tables, categories and orders reference
it directly. Menu items inherit the boundary through their category; order items
inherit it through their order.

Every authenticated read and write is constrained by the current user's
`mess_id`. Public Phase 1 routes resolve one configured default mess.

## Tables

### `messes`

- Identity, display name and unique slug.
- Active flag and audit timestamps.
- Future owner for branches, plans, subscriptions and tenant settings.

### `users`

- Mess foreign key.
- Unique email.
- Argon2 password hash.
- Admin role and active flag.
- Soft deletion and audit timestamps.

### `restaurant_tables`

- Mess foreign key.
- Table number, display name, capacity and active flag.
- Unique `(mess_id, number)`.
- Soft deletion and audit timestamps.

The QR payload is a deterministic application URL, not a stored secret:
`/order/table/{number}`.

### `menu_categories`

- Mess foreign key.
- Name, description, display order and active flag.
- Soft deletion and audit timestamps.

### `menu_items`

- Category foreign key.
- Name, description, decimal price and optional Cloudinary URL.
- Vegetarian, availability and display-order fields.
- Non-negative price check.
- Soft deletion and audit timestamps.

### `orders`

- Mess and optional table foreign keys.
- Public UUID for customer tracking.
- Tenant-scoped idempotency key and readable order number.
- Source, status, payment method/status, customer note and totals.
- Completion and audit timestamps.

Important constraints:

- unique `(mess_id, idempotency_key)`;
- unique `(mess_id, order_number)`;
- table source requires a table;
- standing source prohibits a table;
- total must be non-negative.

### `order_items`

- Order and original menu-item foreign keys.
- Immutable item-name and unit-price snapshots.
- Quantity, line total and preparation note.
- Positive quantity and non-negative money checks.

Historical orders remain accurate after menu edits.

### `order_status_history`

- Order foreign key.
- New status.
- Optional admin user who made the change.
- Transition timestamp.

## Index strategy

The migration indexes:

- tenant foreign keys;
- order public IDs;
- order status;
- order creation time;
- table/category relations;
- soft-delete timestamps where lookup frequency warrants it.

As data grows, add a composite operational index such as
`(mess_id, status, created_at DESC)` based on `EXPLAIN ANALYZE` evidence.

## Deletion policy

Users, tables, categories and items use `deleted_at`. Orders and status history
are retained as business records. Production should define:

- statutory retention period;
- anonymization policy for customer notes;
- image deletion policy in Cloudinary;
- backup retention and restore drills.

## Migrations

Alembic is the only supported schema change mechanism.

```bash
docker compose run --rm backend alembic current
docker compose run --rm backend alembic upgrade head
```

Generate migrations from model changes and review SQL before applying:

```bash
cd backend
alembic revision --autogenerate -m "describe change"
```
