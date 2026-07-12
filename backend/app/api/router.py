from fastapi import APIRouter

from app.api.routes import auth, dashboard, menu, orders, public, tables, websocket

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(menu.router, prefix="/menu", tags=["menu"])
api_router.include_router(tables.router, prefix="/tables", tags=["tables"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(public.router, prefix="/public", tags=["customer"])
api_router.include_router(websocket.router, tags=["websocket"])
