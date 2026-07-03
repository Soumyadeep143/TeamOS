from fastapi import APIRouter

router = APIRouter(prefix="/browser", tags=["websocket"])

@router.get("/status")
def websocket_status():
    return {"status": "websocket endpoint placeholder"}
