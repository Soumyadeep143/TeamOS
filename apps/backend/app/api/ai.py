from typing import Any, Dict, Optional
from fastapi import APIRouter, Body, Depends, Query
from app.schemas.context import ContextShare
from app.services.context_service import ContextService
from app.core.auth import get_current_user, verify_workspace_access

router = APIRouter(prefix="/ai", tags=["ai"])
context_service = ContextService()

@router.post("/run")
def run_ai(
    payload: Optional[Dict[str, Any]] = Body(default=None),
    workspace_id: str = Query("demo-workspace-123", description="Workspace ID for AI research scope"),
    current_user: str = Depends(get_current_user)
):
    verify_workspace_access(workspace_id, current_user)
    goal_text = (payload or {}).get("goal", "Research workspace context")
    model_name = (payload or {}).get("model", "gemini-1.5-flash")

    context_in = ContextShare(
        type="page",
        title=f"AI research: {goal_text}",
        url="http://127.0.0.1:8000/ai/run",
        text_content=f"Autonomous research request for {goal_text} using {model_name}",
        metadata={"model": model_name}
    )

    shared_item = context_service.share_context(context_in, user_id=current_user, workspace_id=workspace_id)
    return {
        "status": "completed",
        "message": "Autonomous research run completed and shared to the workspace feed.",
        "goal": goal_text,
        "model": model_name,
        "context_id": shared_item["context_id"],
        "summary": shared_item["summary"]
    }
