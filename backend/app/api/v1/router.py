from fastapi import APIRouter

from app.api.v1.endpoints import auth, dashboard, menu, orders, reports, tables, upload

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(menu.router, prefix="/menu", tags=["menu"])
api_router.include_router(tables.router, prefix="/tables", tags=["tables"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
