from typing import Dict, Any, List, Optional
from app.core.store import db

class DuplicateService:
    def check_duplicate_document(self, title: str, text: str) -> Dict[str, Any]:
        """
        Simulates vector embedding similarity checks against existing contexts (FR-20).
        If similarity > 80%, flags it as a duplicate (FR-21) and provides merge choices (FR-22).
        """
        # Simple similarity heuristic based on title intersection
        cleaned_title = title.lower().strip()
        
        for ctx_id, ctx in db.contexts.items():
            ctx_title = ctx["title"].lower().strip()
            # Simple intersection check
            words1 = set(cleaned_title.split())
            words2 = set(ctx_title.split())
            if not words1 or not words2:
                continue
                
            intersection = words1.intersection(words2)
            similarity = len(intersection) / max(len(words1), len(words2))
            
            # If similarity meets threshold
            if similarity >= 0.6: # lower slightly for simpler heuristics in mock
                sim_percent = int(similarity * 100)
                return {
                    "duplicate_found": True,
                    "similarity_score": sim_percent,
                    "matched_context_id": ctx_id,
                    "matched_title": ctx["title"],
                    "created_by": ctx["created_by"],
                    "suggested_actions": ["Merge", "Ignore", "Replace", "Create New Version"]
                }
                
        return {
            "duplicate_found": False,
            "similarity_score": 0,
            "suggested_actions": []
        }
