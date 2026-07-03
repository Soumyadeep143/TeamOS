import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.store import db
from app.schemas.context import ContextShare

class ContextService:
    def share_context(self, context_in: ContextShare, user_id: str = "user-1") -> Dict[str, Any]:
        context_id = f"ctx-{uuid.uuid4().hex[:8]}"
        
        # Simple AI Summary generation logic simulator
        # In a real environment, this would call the ai-engine summarizer agent
        summary = None
        if context_in.type == "page":
            summary = f"Summary of '{context_in.title}': The user visited {context_in.url} and captured this page."
        elif context_in.type == "highlight":
            summary = f"Shared highlight from page: '{context_in.text_content[:60]}...'"
        elif context_in.type == "document":
            summary = f"Uploaded document: {context_in.title} containing extracted content."
            
        new_ctx = {
            "context_id": context_id,
            "type": context_in.type,
            "title": context_in.title,
            "url": context_in.url,
            "summary": summary,
            "created_by": user_id,
            "created_at": datetime.now()
        }
        
        db.contexts[context_id] = new_ctx
        return new_ctx

    def get_context(self, context_id: str) -> Optional[Dict[str, Any]]:
        return db.contexts.get(context_id)

    def list_feed(self) -> List[Dict[str, Any]]:
        # Return feed sorted by date descending (newest first)
        all_items = list(db.contexts.values())
        return sorted(all_items, key=lambda x: x["created_at"], reverse=True)
