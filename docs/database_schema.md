# Database Schema

All tables include `created_at` and `updated_at` timestamps. Soft deletes are modelled via `deleted_at`.

## `users`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR | |
| email | VARCHAR | unique |
| password_hash | VARCHAR | bcrypt |
| role | VARCHAR | `admin` / `customer` |
| is_active | BOOLEAN | default true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | soft delete |

## `restaurant_tables`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| number | INTEGER | unique per mess |
| is_standing | BOOLEAN | default false |
| is_active | BOOLEAN | default true |
| qr_code_url | VARCHAR | optional |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | soft delete |

## `menu_categories`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR | |
| sort_order | INTEGER | default 0 |
| is_active | BOOLEAN | default true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | soft delete |

## `menu_items`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| category_id | UUID | FK |
| name | VARCHAR | |
| description | TEXT | optional |
| price | NUMERIC(10,2) | |
| image_url | VARCHAR | optional |
| is_available | BOOLEAN | default true |
| is_enabled | BOOLEAN | default true |
| sort_order | INTEGER | default 0 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | soft delete |

## `orders`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| order_number | VARCHAR | unique |
| table_id | UUID | FK |
| order_type | VARCHAR | `table` / `standing` |
| status | VARCHAR | pending, accepted, preparing, ready, completed, cancelled |
| payment_method | VARCHAR | `cash` |
| payment_status | VARCHAR | `pending` / `paid` |
| notes | TEXT | optional |
| total_amount | NUMERIC(10,2) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| completed_at | TIMESTAMP | optional |
| deleted_at | TIMESTAMP | soft delete |

## `order_items`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| order_id | UUID | FK |
| menu_item_id | UUID | FK |
| quantity | INTEGER | |
| unit_price | NUMERIC(10,2) | snapshot |
| notes | TEXT | optional |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## `order_status_history`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| order_id | UUID | FK |
| status | VARCHAR | |
| actor | VARCHAR | optional |
| created_at | TIMESTAMP | |

## `payments` (future)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| order_id | UUID | FK |
| provider | VARCHAR | cash/razorpay |
| amount | NUMERIC(10,2) | |
| status | VARCHAR | |
| created_at | TIMESTAMP | |
