from datetime import datetime
import uuid
from typing import Dict, List, Any

# Simple thread-safe mock database in memory
class MemoryStore:
    def __init__(self):
        self.workspaces: Dict[str, Dict[str, Any]] = {}
        self.members: Dict[str, Dict[str, Any]] = {}
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.contexts: Dict[str, Dict[str, Any]] = {}
        self.events: List[Dict[str, Any]] = []
        
        # Initialize with some default demo data so the app isn't empty out-of-the-box
        self._init_demo_data()

    def _init_demo_data(self):
        # Demo workspace
        ws_id = "demo-workspace-123"
        self.workspaces[ws_id] = {
            "workspace_id": ws_id,
            "name": "TeamOS Demo Workspace",
            "description": "Welcome to your collaborative browser sandbox",
            "created_at": datetime.now(),
            "members": ["user-1", "user-2"],
            "projects": ["Hackathon MVP"]
        }
        
        # Demo members
        self.members["user-1"] = {
            "user_id": "user-1",
            "display_name": "Soumyadeep",
            "status": "online",
            "current_activity": "Researching Browser Use",
            "availability": [
                {"day": "Monday", "start_time": "18:00", "end_time": "23:00"}
            ],
            "progress": 78
        }
        self.members["user-2"] = {
            "user_id": "user-2",
            "display_name": "John Doe",
            "status": "busy",
            "current_activity": "Editing documentation",
            "availability": [
                {"day": "Monday", "start_time": "17:00", "end_time": "22:00"}
            ],
            "progress": 45
        }
        
        # Demo tasks
        task1_id = "task-1"
        self.tasks[task1_id] = {
            "task_id": task1_id,
            "workspace_id": "demo-workspace-123",
            "title": "Build FastAPI backend endpoints",
            "assignee": "user-1",
            "status": "in-progress",
            "progress": 50,
            "checklist": [
                {"title": "Initialize models", "completed": True},
                {"title": "Define Pydantic schemas", "completed": True},
                {"title": "Implement database migrations", "completed": False},
                {"title": "Hook up live websockets", "completed": False}
            ]
        }
        
        # Demo context page share
        ctx1_id = "ctx-1"
        self.contexts[ctx1_id] = {
            "context_id": ctx1_id,
            "workspace_id": "demo-workspace-123",
            "type": "page",
            "title": "Browser Use Competitor Analysis",
            "url": "https://github.com/browser-use/browser-use",
            "summary": "GitHub repository for Browser Use agent framework.",
            "created_by": "user-1",
            "created_at": datetime.now()
        }
        
        # Demo timeline events
        self.events = [
            {
                "event_id": "event-1",
                "timestamp": datetime.now(),
                "user": "Soumyadeep",
                "user_id": "user-1",
                "type": "workspace_create",
                "message": "created workspace: TeamOS Demo Workspace",
                "details": {}
            },
            {
                "event_id": "event-2",
                "timestamp": datetime.now(),
                "user": "John Doe",
                "user_id": "user-2",
                "type": "member_join",
                "message": "joined the workspace",
                "details": {}
            }
        ]

# Global database instance
db = MemoryStore()

