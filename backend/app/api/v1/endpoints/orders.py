from uuid import UUID

from fastapi import APIRouter

from app.api.deps import AdminUser, DbDep
from app.schemas.common import ApiResponse
from app.schemas.order import OrderCreate, OrderRead, OrderUpdateStatus
from app.services.order_service import OrderService

router = APIRouter()


@router.get("", response_model=ApiResponse[list[OrderRead]])
def list_orders(db: DbDep, user: AdminUser, active_only: bool = False):
    service = OrderService()
    return ApiResponse(data=service.list_orders(db, active_only=active_only))


@router.post("", response_model=ApiResponse[OrderRead])
def create_order(db: DbDep, data: OrderCreate):
    service = OrderService()
    order = service.create_order(db, data)
    return ApiResponse(data=order)


@router.get("/{order_id}", response_model=ApiResponse[OrderRead])
def get_order(order_id: UUID, db: DbDep):
    service = OrderService()
    return ApiResponse(data=service.get_order(db, order_id))


@router.put("/{order_id}/status", response_model=ApiResponse[OrderRead])
async def update_status(order_id: UUID, db: DbDep, user: AdminUser, data: OrderUpdateStatus):
    service = OrderService()
    order = await service.update_status(db, order_id, data, actor=user.email)
    return ApiResponse(data=order)


@router.post("/{order_id}/pay", response_model=ApiResponse[OrderRead])
async def mark_paid(order_id: UUID, db: DbDep, user: AdminUser):
    service = OrderService()
    order = await service.mark_paid(db, order_id)
    return ApiResponse(data=order)


@router.get("/number/{order_number}", response_model=ApiResponse[OrderRead])
def get_order_by_number(order_number: str, db: DbDep):
    service = OrderService()
    return ApiResponse(data=service.get_order_by_number(db, order_number))
