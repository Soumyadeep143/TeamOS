import re
from urllib.parse import urlparse
from typing import Any, Dict, List
from app.core.store import db

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
    Entity extraction is a local heuristic today; swap in hydra_service once
    real HydraDB credentials are available (see services/hydra_service.py).
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
        nodes: Dict[str, Dict[str, Any]] = {}
        edges: List[Dict[str, str]] = []

        def add_node(node_id: str, entity_type: str, label: str):
            if node_id not in nodes:
                nodes[node_id] = {"id": node_id, "type": entity_type, "label": label}

        for ctx_id, ctx in db.contexts.items():
            context_node_id = f"context:{ctx_id}"
            add_node(context_node_id, "Context", ctx["title"])

            creator_id = ctx.get("created_by")
            member = db.members.get(creator_id)
            if member:
                person_node_id = f"person:{creator_id}"
                add_node(person_node_id, "Person", member["display_name"])
                edges.append({"source": person_node_id, "target": context_node_id, "relation": "shared"})

            if ctx.get("url"):
                domain = urlparse(ctx["url"]).netloc or ctx["url"]
                website_node_id = f"website:{domain}"
                add_node(website_node_id, "Website", domain)
                edges.append({"source": context_node_id, "target": website_node_id, "relation": "sourced_from"})

            combined_text = " ".join(filter(None, [ctx.get("title"), ctx.get("summary")]))
            for phrase in self._extract_entities(combined_text):
                entity_type = "Technology" if phrase.lower() in KNOWN_TECHNOLOGIES else "Topic"
                entity_node_id = f"entity:{phrase.lower()}"
                add_node(entity_node_id, entity_type, phrase)
                edges.append({"source": context_node_id, "target": entity_node_id, "relation": "mentions"})

        return {"nodes": list(nodes.values()), "edges": edges}
