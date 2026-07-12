import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

from app.core.config import get_settings


class RateLimitMiddleware:
    def __init__(self) -> None:
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def __call__(self, request: Request, call_next):
        settings = get_settings()
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        client = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60.0
        limit = settings.RATE_LIMIT_REQUESTS_PER_MINUTE

        self.requests[client] = [t for t in self.requests[client] if now - t < window]
        if len(self.requests[client]) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )
        self.requests[client].append(now)
        return await call_next(request)
