from collections import defaultdict
from uuid import UUID

from fastapi import WebSocket

from app.schemas.order import OrderResponse


class ConnectionManager:
    def __init__(self) -> None:
        self.order_connections: dict[UUID, set[WebSocket]] = defaultdict(set)
        self.admin_connections: dict[UUID, set[WebSocket]] = defaultdict(set)

    async def connect_order(self, public_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self.order_connections[public_id].add(websocket)

    async def connect_admin(self, mess_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self.admin_connections[mess_id].add(websocket)

    def disconnect_order(self, public_id: UUID, websocket: WebSocket) -> None:
        self.order_connections[public_id].discard(websocket)

    def disconnect_admin(self, mess_id: UUID, websocket: WebSocket) -> None:
        self.admin_connections[mess_id].discard(websocket)

    async def broadcast_order(self, order: OrderResponse) -> None:
        payload = order.model_dump(mode="json")
        await self._broadcast(self.order_connections[order.public_id], payload)

    async def broadcast_admin(self, mess_id: UUID, order: OrderResponse) -> None:
        await self._broadcast(
            self.admin_connections[mess_id], order.model_dump(mode="json")
        )

    @staticmethod
    async def _broadcast(connections: set[WebSocket], payload: dict[str, object]) -> None:
        stale: list[WebSocket] = []
        for websocket in connections:
            try:
                await websocket.send_json(payload)
            except RuntimeError:
                stale.append(websocket)
        for websocket in stale:
            connections.discard(websocket)


connection_manager = ConnectionManager()
