from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="The name of the workspace")
    description: Optional[str] = Field(None, max_length=255, description="Workspace description")

class WorkspaceJoin(BaseModel):
    invite_code: str = Field(..., min_length=1, description="Invitation or workspace code")

class WorkspaceResponse(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    members: List[str] = []
    projects: List[str] = []

    class Config:
        from_attributes = True
