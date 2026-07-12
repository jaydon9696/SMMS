from fastapi import APIRouter

from app.api.deps import AdminUser, DbDep
from app.schemas.common import ApiResponse
from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/summary", response_model=ApiResponse[DashboardSummary])
def get_summary(db: DbDep, user: AdminUser):
    service = DashboardService()
    return ApiResponse(data=service.summary(db))


@router.get("/live-orders", response_model=ApiResponse[list[dict]])
def get_live_orders(db: DbDep, user: AdminUser):
    service = DashboardService()
    return ApiResponse(data=service.live_orders(db))


@router.get("/tables", response_model=ApiResponse[list[dict]])
def get_table_cards(db: DbDep, user: AdminUser):
    service = DashboardService()
    return ApiResponse(data=service.table_cards(db))
