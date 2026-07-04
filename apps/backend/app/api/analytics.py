import logging
from fastapi import APIRouter, HTTPException, status, Query, Depends
from app.services.wla_service import WLAservice
from app.core.auth import get_current_user, verify_workspace_access

logger = logging.getLogger("teamos.api.analytics")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/analytics", tags=["analytics"])
wla_service = WLAservice()

@router.get("/wla")
def get_workload_analysis(
    workspace_id: str = Query("demo-workspace-123", description="Workspace ID for WLA check"),
    current_user: str = Depends(get_current_user)
):
    """
    Returns workload analysis (overloaded / idle teammates) and meeting suggestions.
    """
    logger.info("Requesting workload analysis for workspace: %s by user: %s", workspace_id, current_user)
    verify_workspace_access(workspace_id, current_user)
    try:
        return wla_service.get_workload_analysis(workspace_id)
    except Exception as e:
        logger.exception("Failed to compile workload analysis")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while compiling workload analysis: {str(e)}"
        )

@router.get("/heatmap")
def get_availability_heatmap(
    workspace_id: str = Query("demo-workspace-123", description="Workspace ID for availability heatmap"),
    current_user: str = Depends(get_current_user)
):
    """
    Returns a weekly availability heatmap grid ( occupancy count per hour ).
    """
    logger.info("Requesting availability heatmap for workspace: %s by user: %s", workspace_id, current_user)
    verify_workspace_access(workspace_id, current_user)
    try:
        return wla_service.get_availability_heatmap(workspace_id)
    except Exception as e:
        logger.exception("Failed to build availability heatmap")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while building availability heatmap: {str(e)}"
        )
