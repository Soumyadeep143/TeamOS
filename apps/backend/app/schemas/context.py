import html
from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Optional, Literal
from datetime import datetime

VALID_CONTEXT_TYPES = ("page", "document", "highlight", "note", "link")

class ContextShare(BaseModel):
    type: Literal["page", "document", "highlight", "note", "link"] = Field(
        ..., description="Type of shared context: page, document, highlight, note, or link"
    )
    title: str = Field(..., min_length=1, max_length=200, description="Title of the context item")
    url: Optional[str] = Field(None, description="URL of the webpage, if applicable")
    text_content: Optional[str] = Field(None, max_length=1048576, description="Extracted page text or highlight text")
    metadata: Optional[dict] = Field(default_factory=dict, description="Additional context metadata")

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_title(cls, v):
        if isinstance(v, str):
            return html.escape(v.strip())
        return v

    @field_validator("text_content", mode="before")
    @classmethod
    def sanitize_text_content(cls, v):
        if isinstance(v, str):
            # Enforce size limits before sanitization to prevent memory overhead
            if len(v) > 1048576:
                raise ValueError("Payload size exceeds maximum allowed limit (1MB).")
            return html.escape(v.strip())
        return v

class ContextResponse(BaseModel):
    context_id: str
    type: str
    title: str
    url: Optional[str] = None
    summary: Optional[str] = None
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True
