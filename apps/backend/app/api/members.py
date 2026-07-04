import logging
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.member import MemberResponse, MemberUpdate
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

@router.patch("/{user_id}", response_model=MemberResponse)
def update_member_presence(user_id: str, member_in: MemberUpdate):
    """
    Updates the presence state, availability, status, or progress of a workspace member.
    """
    logger.info("Updating presence details for user ID: %s", user_id)
    try:
        if user_id not in db.members:
            # Create a placeholder if it does not exist
            db.members[user_id] = {
                "user_id": user_id,
                "display_name": f"User {user_id[-4:]}",
                "status": "online",
                "current_activity": "Joined",
                "availability": [],
                "progress": 0
            }
        
        member = db.members[user_id]
        if member_in.display_name is not None:
            member["display_name"] = member_in.display_name
        if member_in.status is not None:
            member["status"] = member_in.status
        if member_in.current_activity is not None:
            member["current_activity"] = member_in.current_activity
        if member_in.availability is not None:
            member["availability"] = [{"day": item.day, "start_time": item.start_time, "end_time": item.end_time} for item in member_in.availability]
        if member_in.progress is not None:
            member["progress"] = member_in.progress
            
        return member
    except Exception as e:
        logger.exception("Failed to update presence for user ID: %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating presence: {str(e)}"
        )
