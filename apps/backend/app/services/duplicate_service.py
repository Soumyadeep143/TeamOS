from typing import Any, Dict
from app.core.store import db
from app.services.hydra_service import hydra_service


class DuplicateService:
    def check_duplicate_document(self, title: str, text: str) -> Dict[str, Any]:
        """
        Vector embedding similarity check against existing shared context (FR-20),
        backed by hydra_service. Flags similarity >= 80% as a duplicate (FR-21)
        with merge choices (FR-22).
        """
        self._sync_existing_contexts()

        match = hydra_service.find_similar(title, text, threshold=0.8)
        if not match:
            return {
                "duplicate_found": False,
                "similarity_score": 0,
                "suggested_actions": [],
            }

        matched_context = db.contexts.get(match["document_id"], {})
        return {
            "duplicate_found": True,
            "similarity_score": match["similarity_score"],
            "matched_context_id": match["document_id"],
            "matched_title": match["title"],
            "created_by": matched_context.get("created_by", "a teammate"),
            "suggested_actions": ["Merge", "Ignore", "Replace", "Create New Version"],
        }

    def _sync_existing_contexts(self) -> None:
        """Keeps the vector index current with contexts created outside share_context (e.g. demo seed data)."""
        for ctx_id, ctx in db.contexts.items():
            hydra_service.index_document(ctx_id, ctx["title"], ctx.get("summary") or ctx.get("title", ""))
