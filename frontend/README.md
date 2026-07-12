# SMMS frontend

Next.js 16 App Router application for customer QR ordering and the owner
workspace. Use the root [README](../README.md) for full-stack setup.

```bash
npm ci
BACKEND_INTERNAL_URL=http://localhost:8000/api/v1 npm run dev
```

Useful commands:

```bash
npm run lint
npm run typecheck
npm audit --audit-level=moderate
npm run build
```

Authentication is implemented as a BFF flow: route handlers store the FastAPI
JWT in an HTTP-only cookie and forward it server-side. Do not expose the JWT to
client components.
