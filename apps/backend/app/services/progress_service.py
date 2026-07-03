from typing import Dict, Any
from app.core.store import db

class ProgressService:
    def get_progress_summary(self) -> Dict[str, Any]:
        """
        Aggregates sprint-level progress percentage based on all checklist items across all tasks (FR-33, FR-34).
        """
        all_tasks = list(db.tasks.values())
        if not all_tasks:
            return {"sprint_progress": 0, "total_tasks": 0, "completed_tasks": 0}
            
        total_checklist_items = 0
        completed_checklist_items = 0
        completed_tasks_count = 0
        
        for task in all_tasks:
            if task["status"] == "completed":
                completed_tasks_count += 1
            if task["checklist"]:
                total_checklist_items += len(task["checklist"])
                completed_checklist_items += sum(1 for item in task["checklist"] if item["completed"])
            else:
                # Treat task as single checklist item if no explicit checklist exists
                total_checklist_items += 1
                if task["status"] == "completed":
                    completed_checklist_items += 1
                    
        sprint_progress = int((completed_checklist_items / total_checklist_items) * 100) if total_checklist_items > 0 else 0
        
        # Calculate individual member progress contributions
        member_progress = {}
        for m_id, member in db.members.items():
            # Get tasks assigned to this member
            member_tasks = [t for t in all_tasks if t["assignee"] == m_id]
            if not member_tasks:
                member_progress[member["display_name"]] = 0
                continue
                
            m_total = 0
            m_completed = 0
            for t in member_tasks:
                if t["checklist"]:
                    m_total += len(t["checklist"])
                    m_completed += sum(1 for item in t["checklist"] if item["completed"])
                else:
                    m_total += 1
                    if t["status"] == "completed":
                        m_completed += 1
            percent = int((m_completed / m_total) * 100) if m_total > 0 else 0
            # Sync back to member record
            member["progress"] = percent
            member_progress[member["display_name"]] = percent

        return {
            "sprint_progress": sprint_progress,
            "total_tasks": len(all_tasks),
            "completed_tasks": completed_tasks_count,
            "individual_progress": member_progress
        }
