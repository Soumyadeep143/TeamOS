import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket import manager

logger = logging.getLogger("teamos.api.websocket")

router = APIRouter(prefix="/browser", tags=["websocket"])


@router.get("/status")
def websocket_status():
    return {
        "status": "websocket endpoint active",
        "active_rooms": {room: len(conns) for room, conns in manager.rooms.items()},
    }


ws_router = APIRouter()


@ws_router.websocket("/ws/{workspace_id}")
async def workspace_websocket(websocket: WebSocket, workspace_id: str):
    """
    Real-time presence/context/task broadcast channel for a workspace (NFR-2).
    Clients connect here to receive USER_*, *_SHARED, TASK_*, and notification events
    instead of polling REST endpoints.
    """
    await manager.connect(websocket, workspace_id)
    try:
        while True:
            # Connection is push-only from the server's perspective; this just
            # keeps the socket open and drains any client pings.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, workspace_id)
    except Exception:
        logger.exception("WebSocket error for workspace %s", workspace_id)
        manager.disconnect(websocket, workspace_id)
