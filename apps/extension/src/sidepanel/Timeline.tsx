import React, { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type TimelineEvent = {
  event_id: string;
  timestamp: string;
  user: string;
  user_id: string;
  type: string;
  message: string;
};

export function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/timeline/`;
      if (filterType) {
        url += `?event_type=${filterType}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch timeline");
      }
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading timeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTimeline();
  }, [filterType]);

  return (
    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "12px", color: "#f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8" }}>Timeline Events</h3>
        <button 
          onClick={loadTimeline} 
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            color: "#fff",
            padding: "2px 6px",
            fontSize: "0.7rem",
            cursor: "pointer"
          }}
        >
          Sync
        </button>
      </div>

      {/* Filter by Type */}
      <select
        value={filterType}
        onChange={e => setFilterType(e.target.value)}
        style={{
          width: "100%",
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "6px",
          color: "#fff",
          padding: "6px",
          fontSize: "0.75rem",
          cursor: "pointer"
        }}
      >
        <option value="">All Event Types</option>
        <option value="workspace_create">Workspace Created</option>
        <option value="member_join">Member Joined</option>
        <option value="task_update">Task Updates</option>
        <option value="context_share">Context Shares</option>
      </select>

      {loading && <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Loading events...</div>}
      {error && <div style={{ fontSize: "0.75rem", color: "#f87171" }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
        {events.map((evt) => (
          <div 
            key={evt.event_id} 
            style={{
              padding: "8px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderLeft: "2px solid #38bdf8",
              borderRadius: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#64748b" }}>
              <span><strong>{evt.user}</strong></span>
              <span>{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#e2e8f0" }}>{evt.message}</span>
          </div>
        ))}

        {!loading && events.length === 0 && (
          <div style={{ textAlign: "center", padding: "16px", color: "#64748b", fontSize: "0.75rem" }}>
            No timeline events recorded.
          </div>
        )}
      </div>
    </div>
  );
}
