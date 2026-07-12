import time
from collections import defaultdict

from app.core.config import get_settings


class RateLimitMiddleware:
    def __init__(self, app) -> None:
        self.app = app
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        settings = get_settings()
        if not settings.RATE_LIMIT_ENABLED:
            return await self.app(scope, receive, send)

        from starlette.requests import Request

        request = Request(scope, receive)
        client = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60.0
        limit = settings.RATE_LIMIT_REQUESTS_PER_MINUTE

        self.requests[client] = [t for t in self.requests[client] if now - t < window]
        if len(self.requests[client]) >= limit:
            await send({
                "type": "http.response.start",
                "status": 429,
                "headers": [(b"content-type", b"application/json")],
            })
            await send({
                "type": "http.response.body",
                "body": b'{"success":false,"message":"Rate limit exceeded"}',
            })
            return

        self.requests[client].append(now)
        return await self.app(scope, receive, send)
