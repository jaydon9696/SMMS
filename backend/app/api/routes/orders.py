from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query

from app.api.dependencies import CurrentUser, DbSession
from app.models.enums import OrderStatus
from app.repositories.order import OrderRepository
from app.schemas.common import ApiResponse
from app.schemas.order import OrderResponse, OrderStatusUpdate
from app.services.orders import OrderService
from app.websocket.manager import connection_manager

router = APIRouter()


@router.get("", response_model=ApiResponse[list[OrderResponse]])
async def list_orders(
    session: DbSession,
    user: CurrentUser,
    order_status: Annotated[OrderStatus | None, Query(alias="status")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> ApiResponse[list[OrderResponse]]:
    orders = await OrderRepository(session).list(user.mess_id, order_status, limit)
    return ApiResponse(data=[OrderResponse.model_validate(order) for order in orders])


@router.patch("/{order_id}/status", response_model=ApiResponse[OrderResponse])
async def update_order_status(
    order_id: UUID,
    payload: OrderStatusUpdate,
    session: DbSession,
    user: CurrentUser,
) -> ApiResponse[OrderResponse]:
    order = await OrderService(session).update_status(
        user.mess_id, order_id, payload.status, user.id
    )
    response = OrderResponse.model_validate(order)
    await connection_manager.broadcast_order(response)
    return ApiResponse(data=response)
