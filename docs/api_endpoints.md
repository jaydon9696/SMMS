# API Endpoints

All endpoints are prefixed with `/api/v1`.

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/refresh` | Refresh token |
| GET | `/auth/me` | Current user |
| POST | `/auth/logout` | Logout |

## Menu

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/menu/customer` | Public menu with categories and items |
| GET | `/menu/categories` | List categories |
| POST | `/menu/categories` | Create category |
| GET | `/menu/categories/{id}` | Category with items |
| PUT | `/menu/categories/{id}` | Update category |
| DELETE | `/menu/categories/{id}` | Delete category |
| GET | `/menu/items` | List items |
| POST | `/menu/items` | Create item |
| GET | `/menu/items/{id}` | Get item |
| PUT | `/menu/items/{id}` | Update item |
| DELETE | `/menu/items/{id}` | Delete item |

## Tables

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tables` | List tables with status |
| POST | `/tables` | Create table |
| GET | `/tables/{id}` | Get table |
| GET | `/tables/number/{number}` | Get table by number |
| PUT | `/tables/{id}` | Update table |
| DELETE | `/tables/{id}` | Delete table |

## Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List orders |
| POST | `/orders` | Create order |
| GET | `/orders/{id}` | Get order |
| PUT | `/orders/{id}/status` | Update status |
| POST | `/orders/{id}/pay` | Mark as paid |
| GET | `/orders/number/{order_number}` | Get order by number |

## Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Summary counts |
| GET | `/dashboard/live-orders` | Active orders |
| GET | `/dashboard/tables` | Table status cards |

## Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/daily` | Daily revenue and orders |
| GET | `/reports/popular-items` | Popular items |

## Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/image` | Upload image to Cloudinary |

## WebSockets

| Path | Description |
|------|-------------|
| `/ws/orders/{order_id}` | Order status updates |

Interactive Swagger docs are at `/docs`.
