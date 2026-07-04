import html
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class ChecklistItem(BaseModel):
    title: str = Field(..., min_length=1)
    completed: bool = False

    class Config:
        from_attributes = True

class ChecklistItemInput(BaseModel):
    title: str = Field(..., min_length=1)
    completed: bool = False

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_title(cls, v):
        if isinstance(v, str):
            return html.escape(v.strip())
        return v

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    assignee: Optional[str] = Field(None, description="User ID of assignee")
    checklist: List[ChecklistItemInput] = Field(default_factory=list, description="Task checklist items")

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_title(cls, v):
        if isinstance(v, str):
            return html.escape(v.strip())
        return v

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    assignee: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    checklist: Optional[List[ChecklistItemInput]] = None

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_title(cls, v):
        if isinstance(v, str):
            return html.escape(v.strip())
        return v

class TaskResponse(BaseModel):
    task_id: str
    title: str
    assignee: Optional[str] = None
    status: str
    progress: int
    checklist: List[ChecklistItem] = []

    class Config:
        from_attributes = True
