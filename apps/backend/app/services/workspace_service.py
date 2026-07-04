import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.store import db
from app.schemas.workspace import WorkspaceCreate

class WorkspaceService:
    def create_workspace(self, workspace_in: WorkspaceCreate, owner_id: str = "user-1") -> Dict[str, Any]:
        workspace_id = f"ws-{uuid.uuid4().hex[:8]}"
        new_ws = {
            "workspace_id": workspace_id,
            "name": workspace_in.name,
            "description": workspace_in.description,
            "created_at": datetime.now(),
            "members": [owner_id],
            "projects": []
        }
        db.workspaces[workspace_id] = new_ws
        
        # Log event to timeline
        try:
            from app.services.timeline_service import TimelineService
            TimelineService().log_event(
                event_type="workspace_create",
                message=f"created workspace: '{workspace_in.name}'",
                user_id=owner_id,
                details={"workspace_id": workspace_id}
            )
        except Exception:
            pass
            
        return new_ws

    def join_workspace(self, workspace_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if workspace_id not in db.workspaces:
            return None
        ws = db.workspaces[workspace_id]
        if user_id not in ws["members"]:
            ws["members"].append(user_id)
            
            # Log event to timeline
            try:
                from app.services.timeline_service import TimelineService
                TimelineService().log_event(
                    event_type="member_join",
                    message=f"joined the workspace",
                    user_id=user_id,
                    details={"workspace_id": workspace_id}
                )
            except Exception:
                pass
                
        return ws

    def get_workspace(self, workspace_id: str) -> Optional[Dict[str, Any]]:
        return db.workspaces.get(workspace_id)

    def get_workspace_members(self, workspace_id: str) -> Optional[List[Dict[str, Any]]]:
        ws = db.workspaces.get(workspace_id)
        if not ws:
            return None
        member_list = []
        for m_id in ws["members"]:
            if m_id in db.members:
                member_list.append(db.members[m_id])
            else:
                # Add default placeholder profile for user ID if it doesn't exist
                placeholder = {
                    "user_id": m_id,
                    "display_name": f"User {m_id[-4:]}",
                    "status": "online",
                    "current_activity": "Joined workspace",
                    "availability": [],
                    "progress": 0
                }
                db.members[m_id] = placeholder
                member_list.append(placeholder)
        return member_list
