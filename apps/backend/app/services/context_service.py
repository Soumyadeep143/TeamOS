import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.store import db
from app.schemas.context import ContextShare
from app.services.ai_engine_client import ai_engine_client

class ContextService:
    def share_context(self, context_in: ContextShare, user_id: str = "user-1") -> Dict[str, Any]:
        context_id = f"ctx-{uuid.uuid4().hex[:8]}"

        summary = self._generate_summary(context_in)

        new_ctx = {
            "context_id": context_id,
            "type": context_in.type,
            "title": context_in.title,
            "url": context_in.url,
            "summary": summary,
            "created_by": user_id,
            "created_at": datetime.now(),
            "metadata": context_in.metadata or {}
        }

        db.contexts[context_id] = new_ctx
        return new_ctx

    def _generate_summary(self, context_in: ContextShare) -> Optional[str]:
        """
        Summarizes shared page/highlight/document text via the ai-engine
        Summarizer (real LLM call when a key is configured, extractive
        fallback otherwise). Falls back to a plain description when no
        text content was captured at all (e.g. a bare URL share).
        """
        if context_in.text_content:
            result = ai_engine_client.summarize(context_in.text_content)
            return result["summary"]

        if context_in.type == "page":
            return f"Shared page '{context_in.title}' ({context_in.url})."
        if context_in.type == "highlight":
            return f"Shared a highlight from '{context_in.title}'."
        if context_in.type == "document":
            return f"Uploaded document '{context_in.title}'."
        return None

    def get_context(self, context_id: str) -> Optional[Dict[str, Any]]:
        return db.contexts.get(context_id)

    def list_feed(self) -> List[Dict[str, Any]]:
        # Return feed sorted by date descending (newest first)
        all_items = list(db.contexts.values())
        return sorted(all_items, key=lambda x: x["created_at"], reverse=True)

    def search_context(self, query: str) -> List[Dict[str, Any]]:
        """
        Keyword search over shared context (FR-29, FR-31). This is a local
        substring match today; swap for hydra_service semantic search once
        real HydraDB credentials are available.
        """
        cleaned_query = query.lower().strip()
        if not cleaned_query:
            return []

        matches = []
        for ctx in db.contexts.values():
            haystack = " ".join(filter(None, [ctx.get("title"), ctx.get("summary"), ctx.get("url")])).lower()
            if cleaned_query in haystack:
                matches.append(ctx)

        return sorted(matches, key=lambda x: x["created_at"], reverse=True)
