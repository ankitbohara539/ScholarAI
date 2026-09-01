import asyncio

from typing import Annotated

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
from app.websocket.manager import connection_manager

router = APIRouter()


@router.websocket("/ws/notifications")
async def notification_websocket(websocket: WebSocket, db: Annotated[Session, Depends(get_db)]) -> None:
    await websocket.accept()
    user_id: int | None = None
    try:
        authentication = await asyncio.wait_for(websocket.receive_json(), timeout=5)
        token = authentication.get("token") if isinstance(authentication, dict) else None
        if not isinstance(token, str):
            await websocket.close(code=4401, reason="Authentication required")
            return
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
        token_role = UserRole(payload["role"])
        user = UserRepository(db).get_by_id(user_id)
        if user is None or not user.is_active or user.role != token_role:
            await websocket.close(code=4401, reason="Invalid authentication")
            return
        connection_manager.register(user_id, websocket)
        await websocket.send_json({"event": "connected"})
        while True:
            await websocket.receive_text()
    except (asyncio.TimeoutError, AppException, KeyError, TypeError, ValueError):
        await websocket.close(code=4401, reason="Invalid authentication")
    except WebSocketDisconnect:
        pass
    finally:
        if user_id is not None:
            connection_manager.disconnect(user_id, websocket)
