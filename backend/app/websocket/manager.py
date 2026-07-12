import json
from typing import Any

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, order_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(order_id, []).append(websocket)

    def disconnect(self, order_id: str, websocket: WebSocket) -> None:
        if order_id in self.active_connections:
            self.active_connections[order_id] = [
                conn for conn in self.active_connections[order_id] if conn != websocket
            ]
            if not self.active_connections[order_id]:
                del self.active_connections[order_id]

    async def broadcast(self, order_id: str, message: dict[str, Any]) -> None:
        if order_id not in self.active_connections:
            return
        disconnected = []
        for connection in self.active_connections[order_id]:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(order_id, conn)

    async def broadcast_order_update(self, order_id: str, status: str, message: str | None = None) -> None:
        await self.broadcast(
            order_id,
            {
                "type": "order_status_update",
                "order_id": order_id,
                "status": status,
                "message": message or f"Order is {status}",
            },
        )


manager = WebSocketManager()
