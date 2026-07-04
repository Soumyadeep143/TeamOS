import React, { useCallback, useEffect, useState } from "react";
import { getKnowledgeGraph } from "@teamos/sdk";
import type { KnowledgeGraph } from "@teamos/types";
import { useWorkspaceSocket } from "../hooks/useWorkspaceSocket";

const GRAPH_REFRESH_EVENTS = new Set(["PAGE_SHARED", "DOCUMENT_SHARED", "HIGHLIGHT_SHARED", "NEW_CONTEXT"]);

const TYPE_COLORS: Record<string, string> = {
  Person: "#38bdf8",
  Context: "#3b82f6",
  Website: "#f59e0b",
  Technology: "#a855f7",
  Topic: "#10b981",
};

export function Knowledge() {
  const [graph, setGraph] = useState<KnowledgeGraph>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  const fetchGraph = useCallback(async () => {
    try {
      const data = await getKnowledgeGraph();
      setGraph(data);
    } catch (error) {
      console.error("Error building knowledge graph:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  useWorkspaceSocket((message) => {
    if (GRAPH_REFRESH_EVENTS.has(message.event)) {
      fetchGraph();
    }
  });

  if (loading && graph.nodes.length === 0) {
    return <div style={{ color: "#94a3b8", textAlign: "center", padding: "16px" }}>Building knowledge graph...</div>;
  }

  const nodeLabel = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>Entities ({graph.nodes.length})</div>
        <button
          onClick={fetchGraph}
          style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {graph.nodes.length === 0 ? (
        <div style={{ fontSize: "12px", color: "#64748b" }}>No shared knowledge yet. Share your first webpage.</div>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {graph.nodes.map((node) => (
              <span
                key={node.id}
                style={{
                  fontSize: "11px",
                  color: "white",
                  backgroundColor: TYPE_COLORS[node.type] ?? "#64748b",
                  padding: "4px 8px",
                  borderRadius: "12px",
                }}>
                {node.type}: {node.label}
              </span>
            ))}
          </div>

          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "8px" }}>
              Relationships ({graph.edges.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {graph.edges.map((edge, idx) => (
                <div
                  key={idx}
                  style={{ fontSize: "12px", color: "#cbd5e1", backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "6px 10px" }}>
                  {nodeLabel(edge.source)} <span style={{ color: "#64748b" }}>— {edge.relation} →</span> {nodeLabel(edge.target)}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
