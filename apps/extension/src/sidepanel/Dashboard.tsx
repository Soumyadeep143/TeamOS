import React, { useCallback, useEffect, useState } from "react";
import { getContextFeed, getProgress, getWorkspace, listMembers } from "@teamos/sdk";
import type { ProgressSummary, SharedContext, Workspace } from "@teamos/types";
import { DEMO_WORKSPACE_ID, useWorkspaceSocket } from "../hooks/useWorkspaceSocket";

const REFRESH_EVENTS = new Set([
  "PROGRESS_UPDATED", "TASK_CREATED", "TASK_UPDATED", "TASK_COMPLETED",
  "USER_ACTIVE", "USER_IDLE", "USER_BUSY", "USER_LEFT",
  "PAGE_SHARED", "DOCUMENT_SHARED", "HIGHLIGHT_SHARED", "NEW_CONTEXT",
]);

export function Dashboard() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [recentDiscoveries, setRecentDiscoveries] = useState<SharedContext[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    try {
      const [ws, progressSummary, members, feed] = await Promise.all([
        getWorkspace(DEMO_WORKSPACE_ID),
        getProgress(),
        listMembers(),
        getContextFeed(),
      ]);
      setWorkspace(ws);
      setProgress(progressSummary);
      setOnlineCount(members.filter((m) => m.status === "online" || m.status === "busy").length);
      setRecentDiscoveries(feed.slice(0, 3));
    } catch (error) {
      console.error("Error fetching workspace overview:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 20000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  useWorkspaceSocket((message) => {
    if (REFRESH_EVENTS.has(message.event)) {
      fetchOverview();
    }
  });

  if (loading && !workspace) {
    return <div style={{ color: "#94a3b8", textAlign: "center", padding: "16px" }}>Loading workspace overview...</div>;
  }

  const statTile = (label: string, value: string | number, accent: string) => (
    <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "12px", flex: 1 }}>
      <div style={{ fontSize: "20px", fontWeight: 700, color: accent }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc" }}>{workspace?.name ?? "Workspace"}</div>
        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{workspace?.description}</div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {statTile("Members Online", onlineCount, "#10b981")}
        {statTile("Sprint Progress", `${progress?.sprint_progress ?? 0}%`, "#3b82f6")}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {statTile("Total Tasks", progress?.total_tasks ?? 0, "#f59e0b")}
        {statTile("Completed", progress?.completed_tasks ?? 0, "#a855f7")}
      </div>

      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "8px" }}>Recent Discoveries</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {recentDiscoveries.length === 0 && (
            <div style={{ fontSize: "12px", color: "#64748b" }}>No shared knowledge yet. Share your first webpage.</div>
          )}
          {recentDiscoveries.map((item) => (
            <div
              key={item.context_id}
              style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px", padding: "8px 10px", fontSize: "12px", color: "#e2e8f0" }}>
              {item.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
