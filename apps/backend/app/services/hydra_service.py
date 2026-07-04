import logging
import math
import os
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("teamos.services.hydra_service")

WORD_RE = re.compile(r"[a-z0-9]+")


def _vectorize(text: str) -> Counter:
    return Counter(WORD_RE.findall((text or "").lower()))


def _cosine_similarity(a: Counter, b: Counter) -> float:
    if not a or not b:
        return 0.0
    intersection = set(a) & set(b)
    dot = sum(a[w] * b[w] for w in intersection)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class HydraService:
    """
    Abstraction over HydraDB (vector similarity + entity relationship graph,
    per FR-51 to FR-54). No real HydraDB credentials/SDK are wired up yet
    (see .env HYDRADB_API_KEY/HYDRADB_TENANT_ID) — this backs the same
    interface with an in-process cosine-similarity vector index and a plain
    dict-based graph, so duplicate_service/graph_service can already depend
    on a stable API. Swap the method bodies for real HydraDB client calls
    once credentials are available; callers should not need to change.
    """

    def __init__(self):
        self._documents: Dict[str, Dict[str, Any]] = {}
        self._graph_nodes: Dict[str, Dict[str, Any]] = {}
        self._graph_edges: List[Dict[str, str]] = []
        if self.is_configured():
            logger.warning(
                "HYDRADB_API_KEY/HYDRADB_TENANT_ID are set but hydra_service.py still uses "
                "the local fallback implementation — wire in the real HydraDB client here."
            )

    def is_configured(self) -> bool:
        return bool(os.getenv("HYDRADB_API_KEY") and os.getenv("HYDRADB_TENANT_ID"))

    def reset(self) -> None:
        self._documents.clear()
        self._graph_nodes.clear()
        self._graph_edges.clear()

    # --- Vector similarity (FR-20, FR-52) -----------------------------------

    def index_document(self, doc_id: str, title: str, text: str) -> None:
        self._documents[doc_id] = {"title": title, "vector": _vectorize(f"{title} {text}")}

    def find_similar(self, title: str, text: str, threshold: float = 0.8) -> Optional[Dict[str, Any]]:
        query_vector = _vectorize(f"{title} {text}")
        best_match: Optional[Tuple[str, float]] = None
        for doc_id, doc in self._documents.items():
            score = _cosine_similarity(query_vector, doc["vector"])
            if score >= threshold and (best_match is None or score > best_match[1]):
                best_match = (doc_id, score)
        if not best_match:
            return None
        doc_id, score = best_match
        return {"document_id": doc_id, "title": self._documents[doc_id]["title"], "similarity_score": round(score * 100)}

    # --- Knowledge graph (FR-25 to FR-28, FR-53) ----------------------------

    def upsert_node(self, node_id: str, node_type: str, label: str) -> None:
        self._graph_nodes.setdefault(node_id, {"id": node_id, "type": node_type, "label": label})

    def upsert_edge(self, source: str, target: str, relation: str) -> None:
        edge = {"source": source, "target": target, "relation": relation}
        if edge not in self._graph_edges:
            self._graph_edges.append(edge)

    def get_graph(self) -> Dict[str, Any]:
        return {"nodes": list(self._graph_nodes.values()), "edges": self._graph_edges}


hydra_service = HydraService()
