# Testing

## Automated verification

Run all static and unit checks:

```bash
./scripts/verify.sh
```

Individual commands:

```bash
# Backend, using the required Python version
docker run --rm --user root --entrypoint sh \
  -v "$PWD/backend:/app" -w /app python:3.13.5-slim-bookworm \
  -c "pip install -q -e '.[dev]' &&
      ruff check app scripts tests &&
      mypy app scripts &&
      pytest -q"

# Frontend
cd frontend
npm ci
npm run lint
npm run typecheck
npm audit --audit-level=moderate
npm run build
```

## API smoke test

Start the stack:

```bash
docker compose up --build -d
```

Health and public menu:

```bash
curl --fail http://localhost/health
curl --fail http://localhost/api/v1/public/menu
```

Authenticate:

```bash
TOKEN=$(
  curl --fail -s -X POST http://localhost/api/v1/auth/login \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode 'username=admin@smms.local' \
    --data-urlencode 'password=ChangeMe123!' |
  python -c 'import json,sys; print(json.load(sys.stdin)["data"]["access_token"])'
)
curl --fail -H "Authorization: Bearer $TOKEN" \
  http://localhost/api/v1/dashboard/summary
```

Use `/docs` to retrieve a seeded menu-item UUID, create an order with a unique
`Idempotency-Key`, replay it, and verify that only one order exists.

## Manual acceptance checklist

### Authentication

- [ ] Invalid owner credentials show an accessible error.
- [ ] Valid credentials open the dashboard.
- [ ] Refresh preserves the session.
- [ ] Logout clears the session and protected pages redirect.
- [ ] Protected APIs reject missing or invalid JWTs.

### Menu

- [ ] Create a category.
- [ ] Create and edit an item.
- [ ] Upload JPEG, PNG and WebP images with Cloudinary configured.
- [ ] Reject unsupported or oversized images.
- [ ] Disable an item and verify it disappears from the public menu.
- [ ] Soft-delete an item/category and retain historical orders.

### QR and customer order

- [ ] Table QR opens the matching table without manual selection.
- [ ] Standing QR creates an order without a table.
- [ ] Menu works at 320 px with no horizontal scroll.
- [ ] Cart quantity, removal, notes and totals update correctly.
- [ ] Cart survives a refresh for the same QR source.
- [ ] Cash and pay-at-counter methods can be selected.
- [ ] Double submission/replay returns one order.
- [ ] Disabled items and stale prices are revalidated by the backend.

### Workflow and real-time tracking

- [ ] New order appears as pending.
- [ ] Invalid state jumps return HTTP 409.
- [ ] Accepted, preparing, ready and completed update customer tracking.
- [ ] Tracking recovers after disconnect/reload through REST polling.
- [ ] Completed order leaves the live queue.

### Dashboard, tables and reports

- [ ] Revenue counts completed orders only.
- [ ] Order/status cards match the live queue.
- [ ] Table states show available, occupied, preparing and ready.
- [ ] Standing orders remain visually separate.
- [ ] Daily report shows order count, payment totals and popular items.
- [ ] QR copy links use the production origin.

### Accessibility and themes

- [ ] All controls are keyboard reachable with visible focus.
- [ ] Form errors are associated and announced.
- [ ] Light and dark themes retain readable contrast.
- [ ] Reduced-motion preference does not hide information.
- [ ] Mobile, tablet and desktop layouts do not overflow.

### Operations

- [ ] Fresh database runs migration and seed automatically.
- [ ] Repeated startup does not duplicate seed data.
- [ ] `/health` returns 200 through Nginx.
- [ ] Nginx upgrades customer WebSockets.
- [ ] No database port is exposed publicly.
- [ ] Production environment uses unique secrets and TLS.
