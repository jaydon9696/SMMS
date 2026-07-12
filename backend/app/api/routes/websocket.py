from uuid import UUID

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User
from app.websocket.manager import connection_manager

router = APIRouter()


@router.websocket("/ws/orders/{public_id}")
async def order_updates(websocket: WebSocket, public_id: UUID) -> None:
    await connection_manager.connect_order(public_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect_order(public_id, websocket)


@router.websocket("/ws/admin/orders")
async def admin_order_updates(websocket: WebSocket, token: str) -> None:
    try:
        user_id = UUID(decode_access_token(token))
    except (ValueError, jwt.InvalidTokenError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    async with SessionLocal() as session:
        user = await session.scalar(
            select(User).where(
                User.id == user_id,
                User.is_active.is_(True),
                User.deleted_at.is_(None),
            )
        )
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await connection_manager.connect_admin(user.mess_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect_admin(user.mess_id, websocket)
