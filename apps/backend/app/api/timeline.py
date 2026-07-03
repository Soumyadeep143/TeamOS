import logging
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from app.services.timeline_service import TimelineService

logger = logging.getLogger("teamos.api.timeline")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/timeline", tags=["timeline"])
timeline_service = TimelineService()

@router.get("/")
def get_timeline(user_id: Optional[str] = Query(None, description="Filter timeline events by user ID")):
    """
    Returns chronological timeline events of user and agent activities.
    """
    logger.info("Requesting timeline feed: filter_user=%s", user_id)
    try:
        return timeline_service.get_timeline(filter_user=user_id)
    except Exception as e:
        logger.exception("Failed to assemble timeline feed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while compiling the timeline: {str(e)}"
        )
