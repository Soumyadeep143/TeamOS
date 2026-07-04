from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from datetime import datetime

class ContextShare(BaseModel):
    type: str = Field(..., description="Type of shared context, e.g., page, document, highlight")
    title: str = Field(..., min_length=1, description="Title of the context item")
    url: Optional[str] = Field(None, description="URL of the webpage, if applicable")
    text_content: Optional[str] = Field(None, description="Extracted page text or highlight text")
    metadata: Optional[dict] = Field(default_factory=dict, description="Additional context metadata")

class ContextResponse(BaseModel):
    context_id: str
    type: str
    title: str
    url: Optional[str] = None
    summary: Optional[str] = None
    created_by: str
    created_at: datetime
    metadata: Optional[dict] = None

    class Config:
        from_attributes = True
