from pydantic import BaseModel, Field
from typing import List, Optional

class ChecklistItem(BaseModel):
    title: str = Field(..., min_length=1)
    completed: bool = False

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    assignee: Optional[str] = Field(None, description="User ID of assignee")
    checklist: List[ChecklistItem] = Field(default_factory=list, description="Task checklist items")

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    assignee: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    checklist: Optional[List[ChecklistItem]] = None

class TaskResponse(BaseModel):
    task_id: str
    title: str
    assignee: Optional[str] = None
    status: str
    progress: int
    checklist: List[ChecklistItem] = []

    class Config:
        from_attributes = True
