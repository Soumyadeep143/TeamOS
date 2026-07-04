import html
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="The name of the workspace")
    description: Optional[str] = Field(None, max_length=255, description="Workspace description")

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_name(cls, v):
        if isinstance(v, str):
            return html.escape(v.strip())
        return v

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v):
        if isinstance(v, str):
            return html.escape(v.strip())
        return v

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
