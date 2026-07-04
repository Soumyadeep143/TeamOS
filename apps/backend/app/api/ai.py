import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.ai import AIRunRequest
from app.services.ai_engine_client import ai_engine_client
from app.services.graph_service import GraphService
from app.services.notification_service import NotificationService
from app.websocket import manager

logger = logging.getLogger("teamos.api.ai")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/ai", tags=["ai"])
graph_service = GraphService()
notification_service = NotificationService()


@router.post("/run")
async def run_ai(request: AIRunRequest):
    """
    Launches a Browser Use research/monitoring agent for the given prompt (FR-15 to FR-18).
    """
    logger.info("Running AI agent for prompt: %s", request.prompt)
    try:
        await manager.broadcast_all("AI_STARTED", {"prompt": request.prompt})
        result = await ai_engine_client.run_prompt(request.prompt)

        if result.get("status") == "completed":
            notification = notification_service.create_notification(
                "ai_completed",
                f"AI research finished for: '{request.prompt}'",
                data=result,
            )
            await manager.broadcast_all("AI_COMPLETED", notification)
        else:
            await manager.broadcast_all("AI_FAILED", result)

        return result
    except Exception as e:
        logger.exception("AI run failed for prompt: %s", request.prompt)
        await manager.broadcast_all("AI_FAILED", {"prompt": request.prompt, "error": str(e)})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while running the AI agent: {str(e)}"
        )


@router.post("/knowledge-graph")
def build_knowledge_graph():
    """
    Generates the entity relationship graph from the shared context feed (FR-25 to FR-28).
    """
    logger.info("Building knowledge graph")
    try:
        return graph_service.build_graph()
    except Exception as e:
        logger.exception("Failed to build knowledge graph")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while building the knowledge graph: {str(e)}"
        )
