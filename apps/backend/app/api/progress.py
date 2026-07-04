import logging
from fastapi import APIRouter, HTTPException, status, Query, Depends
from app.services.progress_service import ProgressService
from app.core.auth import get_current_user, verify_workspace_access

logger = logging.getLogger("teamos.api.progress")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/progress", tags=["progress"])
progress_service = ProgressService()

@router.get("/")
def get_progress(
    workspace_id: str = Query("demo-workspace-123", description="Workspace ID for progress check"),
    current_user: str = Depends(get_current_user)
):
    """
    Returns aggregated sprint progress, task totals, and member contributions.
    """
    logger.info("Requesting overall sprint progress analytics for workspace %s by user %s", workspace_id, current_user)
    verify_workspace_access(workspace_id, current_user)
    try:
        return progress_service.get_progress_summary(workspace_id)
    except Exception as e:
        logger.exception("Failed to calculate progress summary")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while calculating progress: {str(e)}"
        )
