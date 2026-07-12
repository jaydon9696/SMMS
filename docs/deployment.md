# Deployment

## Ubuntu VPS

1. Install Docker and Docker Compose.
2. Clone the repo and `cd` into it.
3. Copy `.env.example` to `.env` and set production values.
4. Run `docker compose up --build -d`.
5. Configure DNS to point to the VPS.
6. Optionally configure SSL with Certbot or use a reverse proxy with Cloudflare.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string.
- `SECRET_KEY`: JWT secret (use `openssl rand -hex 32`).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Seed admin user.
- `ALLOWED_HOSTS`: Comma-separated list of allowed frontend origins.
- `CLOUDINARY_*`: Optional for image uploads.
- `NEXT_PUBLIC_API_URL`: `/api/v1` for same-origin deployment.
- `NEXT_PUBLIC_WS_URL`: Optional WebSocket URL override.

## Production Checklist

- Use strong `SECRET_KEY` and `ADMIN_PASSWORD`.
- Use `postgres:16` with persistent volume.
- Configure `ALLOWED_HOSTS` for CORS.
- Enable rate limiting (`RATE_LIMIT_ENABLED=true`).
- Use TLS for all traffic.
- Back up the database volume regularly.
- Use Cloudinary for menu images.
