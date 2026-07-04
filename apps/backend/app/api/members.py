import logging
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.member import MemberResponse
from app.core.store import db
from app.core.auth import get_current_user

logger = logging.getLogger("teamos.api.members")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/member", tags=["member"])

@router.get("/", response_model=List[MemberResponse])
def list_members(current_user: str = Depends(get_current_user)):
    """
    Returns workspace member presence and details.
    """
    logger.info("Listing all workspace members and presence states by user: %s", current_user)
    try:
        return list(db.members.values())
    except Exception as e:
        logger.exception("Failed to list members")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while listing members: {str(e)}"
        )
