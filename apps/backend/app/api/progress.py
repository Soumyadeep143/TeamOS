import logging
from fastapi import APIRouter, HTTPException, status
from app.services.progress_service import ProgressService

logger = logging.getLogger("teamos.api.progress")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/progress", tags=["progress"])
progress_service = ProgressService()

@router.get("/")
def get_progress():
    """
    Returns aggregated sprint progress, task totals, and member contributions.
    """
    logger.info("Requesting overall sprint progress analytics")
    try:
        return progress_service.get_progress_summary()
    except Exception as e:
        logger.exception("Failed to calculate progress summary")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while calculating progress: {str(e)}"
        )
