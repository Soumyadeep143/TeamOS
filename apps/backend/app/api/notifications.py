from fastapi import APIRouter

router = APIRouter(prefix="/notification", tags=["notification"])

@router.get("/")
def list_notifications():
    return {"notifications": []}
