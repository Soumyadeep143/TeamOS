import logging
from typing import Any, Dict, List

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder

logger = logging.getLogger("teamos.websocket")


class ConnectionManager:
    """
    Tracks active WebSocket connections grouped by workspace_id room.

    NOTE: MemoryStore entities (members/tasks/contexts) aren't yet tagged with a
    workspace_id, so broadcast_all() fans events out to every connected room. Once
    entities carry a workspace_id, callers can switch to the room-scoped broadcast().
    """

    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, workspace_id: str):
        await websocket.accept()
        self.rooms.setdefault(workspace_id, []).append(websocket)
        logger.info("WebSocket connected to workspace %s (%d total)", workspace_id, len(self.rooms[workspace_id]))

    def disconnect(self, websocket: WebSocket, workspace_id: str):
        conns = self.rooms.get(workspace_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns and workspace_id in self.rooms:
            del self.rooms[workspace_id]
        logger.info("WebSocket disconnected from workspace %s", workspace_id)

    async def broadcast(self, workspace_id: str, event: str, data: Any):
        payload = {"event": event, "data": jsonable_encoder(data)}
        dead: List[WebSocket] = []
        for ws in self.rooms.get(workspace_id, []):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, workspace_id)

    async def broadcast_all(self, event: str, data: Any):
        payload = {"event": event, "data": jsonable_encoder(data)}
        for workspace_id, conns in list(self.rooms.items()):
            dead: List[WebSocket] = []
            for ws in conns:
                try:
                    await ws.send_json(payload)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.disconnect(ws, workspace_id)


manager = ConnectionManager()
