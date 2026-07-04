import React, { useState } from "react";
import { searchContext } from "@teamos/sdk";
import type { SharedContext } from "@teamos/types";

export function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SharedContext[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const data = await searchContext(query.trim());
      setResults(data);
    } catch (error) {
      console.error("Error searching context:", error);
      setResults([]);
    } finally {
      setSearching(false);
      setHasSearched(true);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "Browser Use research" or "pricing"'
          style={{
            flex: 1,
            backgroundColor: "#1e293b",
            color: "white",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "13px"
          }}
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          style={{
            backgroundColor: searching || !query.trim() ? "#475569" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: query.trim() ? "pointer" : "default"
          }}>
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {!hasSearched && (
        <div style={{ fontSize: "12px", color: "#64748b" }}>
          Search across everything the team has shared — pages, highlights, and documents.
        </div>
      )}

      {hasSearched && results.length === 0 && !searching && (
        <div style={{ fontSize: "12px", color: "#64748b" }}>No matches found for "{query}".</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {results.map((item) => (
          <div
            key={item.context_id}
            style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "none" }}>
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </div>
            {item.summary && (
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px", lineHeight: "1.4" }}>{item.summary}</div>
            )}
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "6px" }}>Shared by {item.created_by}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
