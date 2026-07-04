import math
import re
from collections import Counter
from typing import Any, Dict, List, Tuple

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


class DuplicateAgent:
    """
    Local vector-similarity duplicate scanner (bag-of-words cosine similarity)
    for batch-checking a set of documents against each other (FR-20).
    Swap for real HydraDB embedding search once credentials are available
    (see apps/backend/app/services/hydra_service.py).
    """

    def find_duplicates(self, documents: List[Dict[str, Any]], threshold: float = 0.8) -> List[Dict[str, Any]]:
        vectors: List[Tuple[Dict[str, Any], Counter]] = [
            (doc, _vectorize(f"{doc.get('title', '')} {doc.get('text', '')}")) for doc in documents
        ]
        duplicates = []
        for i in range(len(vectors)):
            doc_a, vec_a = vectors[i]
            for j in range(i + 1, len(vectors)):
                doc_b, vec_b = vectors[j]
                similarity = _cosine_similarity(vec_a, vec_b)
                if similarity >= threshold:
                    duplicates.append({
                        "document_a": doc_a.get("id"),
                        "document_b": doc_b.get("id"),
                        "similarity_score": round(similarity * 100, 1),
                    })
        return duplicates
