import logging
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from app.schemas.context import ContextShare, ContextResponse
from app.services.context_service import ContextService
from app.services.duplicate_service import DuplicateService
from app.core.auth import get_current_user, verify_workspace_access

logger = logging.getLogger("teamos.api.context")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/context", tags=["context"])
context_service = ContextService()
duplicate_service = DuplicateService()

@router.post("/share", response_model=ContextResponse, status_code=status.HTTP_201_CREATED)
def share_context(
    context_in: ContextShare,
    workspace_id: str = "demo-workspace-123",
    current_user: str = Depends(get_current_user)
):
    """
    Shares a webpage, highlight, or document with the team.
    Triggers automatic duplicate checks for documents and pages.
    """
    logger.info("Sharing context item for workspace %s: title=%s, type=%s", workspace_id, context_in.title, context_in.type)
    verify_workspace_access(workspace_id, current_user)
    try:
        # Pre-check for duplicate if type is page or document
        if context_in.type in ["document", "page"] and context_in.text_content:
            dup_result = duplicate_service.check_duplicate_document(context_in.title, context_in.text_content)
            if dup_result.get("duplicate_found"):
                logger.warning(
                    "Duplicate warning triggered: '%s' is %d%% similar to '%s' (ID: %s)",
                    context_in.title,
                    dup_result["similarity_score"],
                    dup_result["matched_title"],
                    dup_result["matched_context_id"]
                )

        shared_item = context_service.share_context(context_in, user_id=current_user, workspace_id=workspace_id)
        logger.info("Context item shared successfully: id=%s", shared_item["context_id"])
        return shared_item
    except Exception as e:
        logger.exception("Failed to share context")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while sharing context: {str(e)}"
        )

@router.get("/feed", response_model=List[ContextResponse])
def get_context_feed(
    workspace_id: str = "demo-workspace-123",
    current_user: str = Depends(get_current_user)
):
    """
    Returns the chronological feed of shared context.
    """
    logger.info("Fetching context activity feed for workspace %s", workspace_id)
    verify_workspace_access(workspace_id, current_user)
    try:
        return context_service.list_feed(workspace_id)
    except Exception as e:
        logger.exception("Failed to retrieve context feed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while loading context feed: {str(e)}"
        )
