import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.core.store import db

class TimelineService:
    def log_event(self, event_type: str, message: str, user_id: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Logs a new timeline event.
        """
        user_display = db.members.get(user_id, {}).get("display_name", user_id) if user_id else "System"
        evt_details = details or {}
        if "workspace_id" not in evt_details:
            evt_details["workspace_id"] = "demo-workspace-123"
            
        event = {
            "event_id": f"event-{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now(),
            "user": user_display,
            "user_id": user_id,
            "type": event_type,
            "message": message,
            "details": evt_details
        }
        db.events.append(event)
        return event

    def get_timeline(self, workspace_id: str = "demo-workspace-123", filter_user: Optional[str] = None, filter_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Synthesizes a chronological event timeline from shared context feeds, tasks, and logged events.
        """
        events = []
        
        # Load explicit logged events
        for evt in db.events:
            if evt.get("details", {}).get("workspace_id") == workspace_id:
                events.append(evt)
            
        # Pull context sharing events (backward compatibility)
        for ctx_id, ctx in db.contexts.items():
            if ctx.get("workspace_id") == workspace_id:
                # Check if this context share isn't already logged
                if not any(e["event_id"] == f"event-{ctx_id}" for e in events):
                    user_display = db.members.get(ctx["created_by"], {}).get("display_name", ctx["created_by"])
                    events.append({
                        "event_id": f"event-{ctx_id}",
                        "timestamp": ctx["created_at"],
                        "user": user_display,
                        "user_id": ctx["created_by"],
                        "type": "context_share",
                        "message": f"shared a {ctx['type']}: '{ctx['title']}'",
                        "details": {"url": ctx.get("url"), "summary": ctx.get("summary"), "workspace_id": workspace_id}
                    })
            
        # Pull task updates (backward compatibility)
        for task_id, task in db.tasks.items():
            if task.get("workspace_id") == workspace_id:
                if not any(e["event_id"] == f"event-task-{task_id}" for e in events):
                    assignee_id = task.get("assignee")
                    user_display = db.members.get(assignee_id, {}).get("display_name", "Unassigned") if assignee_id else "Unassigned"
                    events.append({
                        "event_id": f"event-task-{task_id}",
                        "timestamp": db.workspaces.get(workspace_id, {}).get("created_at") or datetime.now(),
                        "user": "System",
                        "user_id": "system",
                        "type": "task_create",
                        "message": f"created task: '{task['title']}' (Assigned to: {user_display})",
                        "details": {"status": task["status"], "progress": task["progress"], "workspace_id": workspace_id}
                    })
            
        # Filter if requested
        if filter_user:
            events = [e for e in events if e["user_id"] == filter_user]
        if filter_type:
            events = [e for e in events if e["type"] == filter_type]
            
        # Sort newest first
        return sorted(events, key=lambda x: x["timestamp"], reverse=True)

