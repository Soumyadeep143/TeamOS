import logging
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.schemas.context import ContextShare, ContextResponse
from app.services.context_service import ContextService
from app.services.duplicate_service import DuplicateService

logger = logging.getLogger("teamos.api.context")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/context", tags=["context"])
context_service = ContextService()
duplicate_service = DuplicateService()

@router.post("/share", response_model=ContextResponse, status_code=status.HTTP_201_CREATED)
def share_context(context_in: ContextShare):
    """
    Shares a webpage, highlight, or document with the team.
    Triggers automatic duplicate checks for documents and pages.
    """
    logger.info("Sharing context item: title=%s, type=%s", context_in.title, context_in.type)
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
                # Note: We don't block the request, we log it and allow sharing, 
                # but could return it in a header or meta. For this MVP, we proceed with creation.

        shared_item = context_service.share_context(context_in, user_id="user-1")
        logger.info("Context item shared successfully: id=%s", shared_item["context_id"])
        return shared_item
    except Exception as e:
        logger.exception("Failed to share context")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while sharing context: {str(e)}"
        )

@router.get("/feed", response_model=List[ContextResponse])
def get_context_feed():
    """
    Returns the chronological feed of shared context.
    """
    logger.info("Fetching context activity feed")
    try:
        return context_service.list_feed()
    except Exception as e:
        logger.exception("Failed to retrieve context feed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while loading context feed: {str(e)}"
        )
