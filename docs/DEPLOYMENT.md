# Ubuntu VPS deployment

## 1. Prepare the host

Use a supported Ubuntu LTS release. Install Docker Engine and the Compose plugin
from Docker's official repository, then enable the service:

```bash
sudo systemctl enable --now docker
docker --version
docker compose version
```

Allow only SSH, HTTP and HTTPS through the host firewall. PostgreSQL is not
published by the Compose file.

## 2. Configure the application

```bash
git clone https://github.com/jaydon9696/SMMS.git
cd SMMS
cp .env.example .env
```

Set:

- a randomly generated `SECRET_KEY` of at least 32 characters;
- a unique PostgreSQL password;
- a strong admin password;
- the final `https://` frontend URL;
- the matching `wss://.../api/v1` WebSocket URL;
- a Cloudinary URL restricted to the production account.

Generate a signing secret:

```bash
openssl rand -hex 32
```

Restrict `.env`:

```bash
chmod 600 .env
```

## 3. Build and start

```bash
docker compose pull
docker compose build --pull
docker compose up -d
docker compose ps
curl --fail http://127.0.0.1/health
```

Backend startup applies Alembic migrations and runs the idempotent seed before
Uvicorn starts. Review migration plans before every production release.

## 4. TLS

The included Nginx is the application edge on port 80. For production, terminate
TLS with one of:

- a host Nginx/Certbot instance proxying to `127.0.0.1:${HTTP_PORT}`;
- a managed load balancer;
- a secure tunnel or ingress platform.

The outer proxy must preserve `Host`, `X-Forwarded-*` and WebSocket upgrade
headers. After enabling TLS, rebuild the frontend with HTTPS/WSS public variables.

## 5. Backups

At minimum, schedule encrypted off-host PostgreSQL dumps:

```bash
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "smms-$(date +%F-%H%M).sql.gz"
```

Keep a tested restore procedure. A backup is not valid until a restore drill succeeds.
Cloudinary asset retention should be configured separately.

## 6. Updates

```bash
git fetch origin
git checkout <release-tag>
docker compose build --pull
docker compose up -d
docker compose ps
curl --fail http://127.0.0.1/health
```

Keep the previous release tag and database backup available for rollback. Database
rollback must follow the migration's documented compatibility strategy; do not
blindly downgrade destructive migrations.

## 7. Monitoring

Monitor:

- `/health` availability and latency;
- container restarts and resource saturation;
- HTTP 5xx and WebSocket disconnect rates;
- PostgreSQL connections, storage, locks and slow queries;
- failed migrations and seed execution;
- Cloudinary upload failures;
- backup age and restore-test age.

Forward container logs to centralized storage and alert on repeated 5xx responses.

## Production limitations to address before horizontal scaling

- The WebSocket connection manager is process-local; run one backend worker.
- Public routes resolve one default mess.
- JWTs are symmetric access tokens without refresh rotation.
- Daily reporting uses UTC boundaries.

See [architecture](ARCHITECTURE.md) for the intended scaling path.
