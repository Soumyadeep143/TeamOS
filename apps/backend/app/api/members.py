import logging
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.member import MemberResponse
from app.core.store import db

logger = logging.getLogger("teamos.api.members")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/member", tags=["member"])

@router.get("/", response_model=List[MemberResponse])
def list_members():
    """
    Returns workspace member presence and details.
    """
    logger.info("Listing all workspace members and presence states")
    try:
        return list(db.members.values())
    except Exception as e:
        logger.exception("Failed to list members")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while listing members: {str(e)}"
        )
