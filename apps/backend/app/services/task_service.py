import uuid
from typing import Dict, Any, List, Optional
from app.core.store import db
from app.schemas.task import TaskCreate, TaskUpdate

class TaskService:
    def create_task(self, task_in: TaskCreate, workspace_id: str = "demo-workspace-123") -> Dict[str, Any]:
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        
        # Calculate initial progress
        total = len(task_in.checklist)
        completed = sum(1 for item in task_in.checklist if item.completed)
        progress = int((completed / total) * 100) if total > 0 else 0
        
        if progress == 100:
            status = "completed"
        elif progress > 0:
            status = "in-progress"
        else:
            status = "todo"
            
        new_task = {
            "task_id": task_id,
            "workspace_id": workspace_id,
            "title": task_in.title,
            "assignee": task_in.assignee,
            "status": status,
            "progress": progress,
            "checklist": [{"title": item.title, "completed": item.completed} for item in task_in.checklist]
        }
        db.tasks[task_id] = new_task
        
        # Log event to timeline
        try:
            from app.services.timeline_service import TimelineService
            assignee_name = db.members.get(task_in.assignee, {}).get("display_name", "Unassigned") if task_in.assignee else "Unassigned"
            TimelineService().log_event(
                event_type="task_update",
                message=f"created task: '{task_in.title}' (Assigned to: {assignee_name})",
                user_id=task_in.assignee or "system",
                details={"task_id": task_id, "status": status, "progress": progress}
            )
        except Exception:
            pass
            
        return new_task

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        return db.tasks.get(task_id)

    def list_tasks(self, workspace_id: str = "demo-workspace-123") -> List[Dict[str, Any]]:
        return [t for t in db.tasks.values() if t.get("workspace_id") == workspace_id]

    def update_task(self, task_id: str, task_in: TaskUpdate) -> Optional[Dict[str, Any]]:
        if task_id not in db.tasks:
            return None
        task = db.tasks[task_id]
        
        if task_in.title is not None:
            task["title"] = task_in.title
        if task_in.assignee is not None:
            task["assignee"] = task_in.assignee
        if task_in.checklist is not None:
            task["checklist"] = [{"title": item.title, "completed": item.completed} for item in task_in.checklist]
            
        # If checklist was updated, recalculate progress automatically
        if task["checklist"]:
            total = len(task["checklist"])
            completed = sum(1 for item in task["checklist"] if item["completed"])
            task["progress"] = int((completed / total) * 100)
        
        if task_in.progress is not None and task_in.checklist is None:
            task["progress"] = task_in.progress
            
        if task_in.status is not None:
            task["status"] = task_in.status
        else:
            # Set status based on progress automatically
            if task["progress"] == 100:
                task["status"] = "completed"
            elif task["progress"] > 0:
                task["status"] = "in-progress"
            else:
                task["status"] = "todo"
                
        # Log event to timeline
        try:
            from app.services.timeline_service import TimelineService
            assignee_id = task.get("assignee")
            TimelineService().log_event(
                event_type="task_update",
                message=f"updated task: '{task['title']}' to {task['status']} ({task['progress']}% done)",
                user_id=assignee_id or "system",
                details={"task_id": task_id, "status": task["status"], "progress": task["progress"]}
            )
        except Exception:
            pass
            
        return task

