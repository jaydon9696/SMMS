from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.manager import manager

websocket_router = APIRouter()


@websocket_router.websocket("/orders/{order_id}")
async def order_updates(websocket: WebSocket, order_id: str):
    await manager.connect(order_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(order_id, websocket)
