# API and WebSockets

Base path: `/api/v1`

Interactive OpenAPI documentation is exposed at `/docs`. Responses use:

```json
{ "data": {} }
```

Errors use:

```json
{
  "error": {
    "code": 409,
    "message": "Cannot transition order from pending to ready"
  }
}
```

## Authentication

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Exchange form credentials for JWT |
| GET | `/auth/me` | Admin | Return current admin |

Direct API clients send `Authorization: Bearer <token>`. The web application
uses `/api/session/login` and keeps the token in an HTTP-only cookie.

## Public ordering

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/public/menu` | Active categories and available items |
| POST | `/public/orders` | Create table or standing order |
| GET | `/public/orders/{public_id}` | Retrieve tracking state |

`POST /public/orders` requires an `Idempotency-Key` header of 8–128 characters.
The first successful command returns 201. A replay returns the same order with 200.

Example:

```bash
curl -X POST http://localhost/api/v1/public/orders \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: checkout-6aa98295-6a01-4ab1' \
  -d '{
    "source": "table",
    "table_number": 1,
    "payment_method": "pay_at_counter",
    "customer_note": "Less spicy",
    "items": [
      {
        "menu_item_id": "REPLACE_WITH_MENU_ITEM_UUID",
        "quantity": 2,
        "note": "No onion"
      }
    ]
  }'
```

## Menu administration

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/menu/categories` | List or create categories |
| PATCH/DELETE | `/menu/categories/{id}` | Update or soft-delete category |
| POST | `/menu/images` | Upload menu image to Cloudinary |
| POST | `/menu/items` | Create item |
| PATCH/DELETE | `/menu/items/{id}` | Update or soft-delete item |

Image uploads accept multipart field `image`, allow JPEG/PNG/WebP and enforce 5 MB.

## Tables

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/tables` | List or create tables |
| PATCH/DELETE | `/tables/{id}` | Update or soft-delete table |

## Orders

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/orders` | List tenant orders; optional `status` and `limit` |
| PATCH | `/orders/{id}/status` | Execute state transition |

Status body:

```json
{ "status": "preparing" }
```

## Dashboard and reports

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/dashboard/summary` | Today's operational metrics |
| GET | `/dashboard/reports/daily` | Revenue, status, payment and item summary |

The report accepts optional `business_date=YYYY-MM-DD`.

## WebSockets

### Customer

`/api/v1/ws/orders/{public_id}`

No account is required; possession of the high-entropy public UUID is the
tracking capability. Events are serialized `OrderResponse` objects.

### Admin

`/api/v1/ws/admin/orders?token=<jwt>`

This endpoint exists for trusted clients. The Phase 1 web dashboard avoids
putting the JWT in browser JavaScript and therefore uses polling.

## Request tracing

Every HTTP response includes `X-Request-ID`. Supply the same header when
correlating client, Nginx and application logs.
