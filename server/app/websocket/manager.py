import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = {}

    def register(self, user_id: int, websocket: WebSocket) -> None:
        self._connections.setdefault(user_id, set()).add(websocket)
        logger.info("Notification WebSocket connected user_id=%s", user_id)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        connections = self._connections.get(user_id)
        if connections is None:
            return
        connections.discard(websocket)
        if not connections:
            self._connections.pop(user_id, None)
        logger.info("Notification WebSocket disconnected user_id=%s", user_id)

    async def send_to_user(self, user_id: int, payload: dict[str, object]) -> None:
        stale: list[WebSocket] = []
        for websocket in tuple(self._connections.get(user_id, set())):
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(user_id, websocket)

    async def close_user(self, user_id: int, code: int = 4403) -> None:
        for websocket in tuple(self._connections.get(user_id, set())):
            try:
                await websocket.close(code=code, reason="Account access changed")
            finally:
                self.disconnect(user_id, websocket)


connection_manager = ConnectionManager()
