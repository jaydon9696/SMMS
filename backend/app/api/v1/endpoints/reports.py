from datetime import date

from fastapi import APIRouter

from app.api.deps import AdminUser, DbDep
from app.schemas.common import ApiResponse
from app.services.report_service import ReportService

router = APIRouter()


@router.get("/daily", response_model=ApiResponse[dict])
def daily_report(db: DbDep, user: AdminUser, target_date: date | None = None):
    service = ReportService()
    return ApiResponse(data=service.daily_report(db, target_date))


@router.get("/popular-items", response_model=ApiResponse[list[dict]])
def popular_items(db: DbDep, user: AdminUser, limit: int = 5):
    service = ReportService()
    return ApiResponse(data=service.popular_items(db, limit))
