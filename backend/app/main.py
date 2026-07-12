from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.middleware.rate_limit import RateLimitMiddleware
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService
from app.services.table_service import TableService
from app.api.v1.endpoints.websocket import websocket_router

logger = get_logger(__name__)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def seed_db() -> None:
    db = SessionLocal()
    try:
        AuthService().seed_admin_user(db)
        TableService().ensure_standing_table(db)
        for i in range(1, 11):
            try:
                TableService().create_table(db, TableCreate(number=i, is_active=True))
            except Exception:
                pass
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RateLimitMiddleware)

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content=ApiResponse(success=False, message="Internal server error").model_dump(),
        )

    @app.get("/api/v1/health", response_model=ApiResponse[dict])
    def health():
        return ApiResponse(data={"status": "ok"})

    app.include_router(api_router, prefix="/api/v1")
    app.include_router(websocket_router, prefix="/ws")

    return app


app = create_app()

# Import for lifespan
from app.schemas.table import TableCreate  # noqa: E402
