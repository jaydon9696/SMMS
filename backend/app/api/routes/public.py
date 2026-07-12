from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, Response, status

from app.api.dependencies import DbSession, DefaultMess
from app.repositories.menu import MenuRepository
from app.repositories.order import OrderRepository
from app.schemas.common import ApiResponse
from app.schemas.menu import MenuCategoryResponse
from app.schemas.order import OrderCreate, OrderResponse
from app.services.orders import OrderService
from app.websocket.manager import connection_manager

router = APIRouter()


@router.get("/menu", response_model=ApiResponse[list[MenuCategoryResponse]])
async def public_menu(
    session: DbSession, mess: DefaultMess
) -> ApiResponse[list[MenuCategoryResponse]]:
    categories = await MenuRepository(session).list_categories(mess.id, public_only=True)
    return ApiResponse(
        data=[MenuCategoryResponse.model_validate(category) for category in categories]
    )


@router.post(
    "/orders", response_model=ApiResponse[OrderResponse], status_code=status.HTTP_201_CREATED
)
async def create_order(
    payload: OrderCreate,
    response: Response,
    session: DbSession,
    mess: DefaultMess,
    idempotency_key: Annotated[
        str, Header(alias="Idempotency-Key", min_length=8, max_length=128)
    ],
) -> ApiResponse[OrderResponse]:
    order, created = await OrderService(session).create(
        mess.id, payload, idempotency_key
    )
    order_response = OrderResponse.model_validate(order)
    if not created:
        response.status_code = status.HTTP_200_OK
    else:
        await connection_manager.broadcast_admin(mess.id, order_response)
    return ApiResponse(data=order_response)


@router.get("/orders/{public_id}", response_model=ApiResponse[OrderResponse])
async def track_order(
    public_id: UUID, session: DbSession
) -> ApiResponse[OrderResponse]:
    order = await OrderRepository(session).get_by_public_id(public_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return ApiResponse(data=OrderResponse.model_validate(order))
