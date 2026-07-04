import React, { useCallback, useEffect, useState } from "react";
import { getTimeline } from "@teamos/sdk";
import type { TimelineEvent } from "@teamos/types";
import { useWorkspaceSocket } from "../hooks/useWorkspaceSocket";

const TIMELINE_REFRESH_EVENTS = new Set([
  "PAGE_SHARED", "DOCUMENT_SHARED", "HIGHLIGHT_SHARED", "NEW_CONTEXT",
  "TASK_CREATED", "TASK_UPDATED", "TASK_COMPLETED",
]);

const TYPE_ICONS: Record<string, string> = {
  context_share: "🌐",
  task_create: "📋",
};

export function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    try {
      const data = await getTimeline();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 20000);
    return () => clearInterval(interval);
  }, [fetchTimeline]);

  useWorkspaceSocket((message) => {
    if (TIMELINE_REFRESH_EVENTS.has(message.event)) {
      fetchTimeline();
    }
  });

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  if (loading && events.length === 0) {
    return <div style={{ color: "#94a3b8", textAlign: "center", padding: "16px" }}>Loading timeline...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {events.length === 0 && (
        <div style={{ fontSize: "12px", color: "#64748b" }}>No activity recorded yet.</div>
      )}
      {events.map((event) => (
        <div
          key={event.event_id}
          style={{
            display: "flex",
            gap: "10px",
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            padding: "10px 12px"
          }}>
          <span style={{ fontSize: "16px" }}>{TYPE_ICONS[event.type] ?? "•"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: "#f1f5f9" }}>
              <strong>{event.user}</strong> {event.message}
            </div>
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>{formatTime(event.timestamp)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
