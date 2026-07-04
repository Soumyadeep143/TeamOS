import logging
from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.schemas.context import ContextShare, ContextResponse
from app.services.context_service import ContextService
from app.services.duplicate_service import DuplicateService
from app.services.notification_service import NotificationService
from app.websocket import manager

logger = logging.getLogger("teamos.api.context")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/context", tags=["context"])
context_service = ContextService()
duplicate_service = DuplicateService()
notification_service = NotificationService()

CONTEXT_SHARED_EVENT = {
    "page": "PAGE_SHARED",
    "document": "DOCUMENT_SHARED",
    "highlight": "HIGHLIGHT_SHARED",
}

@router.post("/share", response_model=ContextResponse, status_code=status.HTTP_201_CREATED)
async def share_context(context_in: ContextShare):
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
                notification = notification_service.create_notification(
                    "duplicate_found",
                    f"Similar {context_in.type} found — {dup_result['similarity_score']}% similarity — "
                    f"uploaded by {dup_result.get('created_by', 'a teammate')}",
                    data=dup_result,
                )
                await manager.broadcast_all("DUPLICATE_FOUND", notification)
                # Note: We don't block the request, we notify the team and allow sharing to proceed.

        shared_item = context_service.share_context(context_in, user_id="user-1")
        logger.info("Context item shared successfully: id=%s", shared_item["context_id"])

        share_event = CONTEXT_SHARED_EVENT.get(context_in.type, "NEW_CONTEXT")
        await manager.broadcast_all(share_event, shared_item)

        if shared_item.get("summary"):
            summary_notification = notification_service.create_notification(
                "summary_ready",
                f"AI summary ready for '{shared_item['title']}'",
                data={"context_id": shared_item["context_id"]},
            )
            await manager.broadcast_all("SUMMARY_READY", summary_notification)

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

@router.get("/search", response_model=List[ContextResponse])
def search_context(q: str = Query(..., min_length=1, description="Search query text")):
    """
    Keyword search over shared context titles, summaries, and URLs (FR-29, FR-31).
    """
    logger.info("Searching context feed: query=%s", q)
    try:
        return context_service.search_context(q)
    except Exception as e:
        logger.exception("Failed to search context feed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while searching context: {str(e)}"
        )
