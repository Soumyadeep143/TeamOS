import logging
from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional
from app.services.timeline_service import TimelineService
from app.core.auth import get_current_user, verify_workspace_access

logger = logging.getLogger("teamos.api.timeline")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/timeline", tags=["timeline"])
timeline_service = TimelineService()

@router.get("/")
def get_timeline(
    workspace_id: str = Query("demo-workspace-123", description="Workspace ID to fetch timeline for"),
    user_id: Optional[str] = Query(None, description="Filter timeline events by user ID"),
    event_type: Optional[str] = Query(None, description="Filter timeline events by event type"),
    current_user: str = Depends(get_current_user)
):
    """
    Returns chronological timeline events of user and agent activities.
    """
    logger.info("Requesting timeline feed for workspace %s: user=%s, type=%s, requester=%s", workspace_id, user_id, event_type, current_user)
    verify_workspace_access(workspace_id, current_user)
    try:
        return timeline_service.get_timeline(workspace_id=workspace_id, filter_user=user_id, filter_type=event_type)
    except Exception as e:
        logger.exception("Failed to assemble timeline feed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while compiling the timeline: {str(e)}"
        )

