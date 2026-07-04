import re
from urllib.parse import urlparse
from typing import Any, Dict, List
from app.core.store import db
from app.services.hydra_service import hydra_service

KNOWN_TECHNOLOGIES = {
    "browser use", "hydradb", "fastapi", "react", "plasmo", "gemini", "openai",
    "postgresql", "redis", "websocket", "chrome", "typescript", "python",
    "zustand", "vite", "pydantic", "uvicorn", "playwright",
}

STOPWORDS = {"The", "This", "That", "And", "For", "With", "From", "Into", "Your"}

# Matches capitalized single words or short capitalized phrases (proper nouns / entity mentions)
CAPITALIZED_PHRASE = re.compile(r"\b([A-Z][a-zA-Z0-9]*(?:\s[A-Z][a-zA-Z0-9]*){0,3})\b")


class GraphService:
    """
    Builds a knowledge graph (FR-25 to FR-28) from the shared context feed.
    Entity extraction is a local heuristic; storage is delegated to
    hydra_service (local graph store today, real HydraDB once credentials
    are configured — see services/hydra_service.py).
    """

    def _extract_entities(self, text: str) -> List[str]:
        if not text:
            return []
        found = set()
        for match in CAPITALIZED_PHRASE.findall(text):
            phrase = match.strip()
            if phrase in STOPWORDS or len(phrase) < 3:
                continue
            found.add(phrase)
        return list(found)

    def build_graph(self) -> Dict[str, Any]:
        for ctx_id, ctx in db.contexts.items():
            context_node_id = f"context:{ctx_id}"
            hydra_service.upsert_node(context_node_id, "Context", ctx["title"])

            creator_id = ctx.get("created_by")
            member = db.members.get(creator_id)
            if member:
                person_node_id = f"person:{creator_id}"
                hydra_service.upsert_node(person_node_id, "Person", member["display_name"])
                hydra_service.upsert_edge(person_node_id, context_node_id, "shared")

            if ctx.get("url"):
                domain = urlparse(ctx["url"]).netloc or ctx["url"]
                website_node_id = f"website:{domain}"
                hydra_service.upsert_node(website_node_id, "Website", domain)
                hydra_service.upsert_edge(context_node_id, website_node_id, "sourced_from")

            combined_text = " ".join(filter(None, [ctx.get("title"), ctx.get("summary")]))
            for phrase in self._extract_entities(combined_text):
                entity_type = "Technology" if phrase.lower() in KNOWN_TECHNOLOGIES else "Topic"
                entity_node_id = f"entity:{phrase.lower()}"
                hydra_service.upsert_node(entity_node_id, entity_type, phrase)
                hydra_service.upsert_edge(context_node_id, entity_node_id, "mentions")

        return hydra_service.get_graph()
