from typing import List, Dict, Any
from app.core.store import db

class TimelineService:
    def get_timeline(self, filter_user: str = None) -> List[Dict[str, Any]]:
        """
        Synthesizes a chronological event timeline from shared context feeds and tasks.
        """
        events = []
        
        # Pull context sharing events
        for ctx_id, ctx in db.contexts.items():
            user_display = db.members.get(ctx["created_by"], {}).get("display_name", ctx["created_by"])
            events.append({
                "event_id": f"event-{ctx_id}",
                "timestamp": ctx["created_at"],
                "user": user_display,
                "user_id": ctx["created_by"],
                "type": "context_share",
                "message": f"shared a {ctx['type']}: '{ctx['title']}'",
                "details": {"url": ctx.get("url"), "summary": ctx.get("summary")}
            })
            
        # Pull task updates
        for task_id, task in db.tasks.items():
            # Mock task creation event (approximate date)
            assignee_id = task.get("assignee")
            user_display = db.members.get(assignee_id, {}).get("display_name", "Unassigned") if assignee_id else "Unassigned"
            events.append({
                "event_id": f"event-task-{task_id}",
                "timestamp": db.workspaces.get("demo-workspace-123", {}).get("created_at"),
                "user": "System",
                "user_id": "system",
                "type": "task_create",
                "message": f"created task: '{task['title']}' (Assigned to: {user_display})",
                "details": {"status": task["status"], "progress": task["progress"]}
            })
            
        # Filter if requested
        if filter_user:
            events = [e for e in events if e["user_id"] == filter_user]
            
        # Sort newest first
        return sorted(events, key=lambda x: x["timestamp"], reverse=True)
