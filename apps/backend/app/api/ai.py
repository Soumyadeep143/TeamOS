from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/run")
def run_ai():
    return {"status": "AI process started"}
