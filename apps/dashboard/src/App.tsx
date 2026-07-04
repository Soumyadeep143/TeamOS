import React, { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@teamos/config";
import {
  createTask,
  getContextFeed,
  getKnowledgeGraph,
  getProgress,
  getWorkspace,
  listMembers,
  listNotifications,
  listTasks,
  markNotificationRead,
  runAI,
  searchContext,
  updateTask,
} from "@teamos/sdk";
import type {
  KnowledgeGraph,
  Member,
  Notification,
  ProgressSummary,
  SharedContext,
  Task,
  Workspace,
  WorkspaceEvent,
} from "@teamos/types";
import { DEMO_WORKSPACE_ID, useWorkspaceSocket } from "./hooks/useWorkspaceSocket";

// Inlined SVG Icon Components for beautiful modern look without packages
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const IconPlay = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);

const IconTerminal = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const STATUS_DOT_COLOR: Record<string, string> = {
  online: "var(--accent-green)",
  busy: "var(--accent-red)",
  idle: "#f59e0b",
  offline: "var(--text-muted)",
};

const STATUS_LABEL: Record<string, string> = {
  online: "Active",
  busy: "Focus Mode",
  idle: "Idle",
  offline: "Offline",
};

const GRAPH_TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  Person: { color: "var(--accent-blue)", bg: "rgba(0,242,254,0.1)" },
  Technology: { color: "var(--accent-purple)", bg: "rgba(79,172,254,0.1)" },
  Website: { color: "var(--accent-green)", bg: "rgba(57,255,20,0.1)" },
  Context: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  Topic: { color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)" },
};

function formatRelativeTime(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return "some time ago";
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SharedContext[] | null>(null);
  const [agentGoal, setAgentGoal] = useState("Extract competitor pricing matrices");
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feed, setFeed] = useState<SharedContext[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [graph, setGraph] = useState<KnowledgeGraph>({ nodes: [], edges: [] });

  const fetchAll = useCallback(async () => {
    try {
      const [ws, memberList, progressSummary, taskList, feedItems, notifs, knowledgeGraph] = await Promise.all([
        getWorkspace(DEMO_WORKSPACE_ID),
        listMembers(),
        getProgress(),
        listTasks(),
        getContextFeed(),
        listNotifications(),
        getKnowledgeGraph(),
      ]);
      setWorkspace(ws);
      setMembers(memberList);
      setProgress(progressSummary);
      setTasks(taskList);
      setFeed(feedItems);
      setNotifications(notifs);
      setGraph(knowledgeGraph);
    } catch (error) {
      console.error("Error loading workspace data:", error);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 20000); // safety-net poll (FR-67)
    return () => clearInterval(interval);
  }, [fetchAll]);

  const wsStatus = useWorkspaceSocket((message: WorkspaceEvent) => {
    if (message.event === "AI_STARTED") {
      setAgentLogs((prev) => [...prev, `🤖 Launching Browser Use agent for: "${(message.data as any)?.prompt ?? agentGoal}"`]);
    } else if (message.event === "AI_COMPLETED") {
      const result = (message.data as any)?.data;
      setAgentLogs((prev) => [...prev, result?.summary ? `✅ Completed: ${result.summary}` : "✅ AI research completed."]);
      setIsAgentRunning(false);
      fetchAll();
    } else if (message.event === "AI_FAILED") {
      setAgentLogs((prev) => [...prev, "❌ AI agent run failed. Check backend logs."]);
      setIsAgentRunning(false);
    } else {
      fetchAll();
    }
  });

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        setSearchResults(await searchContext(searchQuery.trim()));
      } catch (error) {
        console.error("Error searching context:", error);
        setSearchResults([]);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const handleRunAgent = async () => {
    if (isAgentRunning || !agentGoal.trim()) return;
    setAgentLogs([]);
    setIsAgentRunning(true);
    try {
      await runAI(agentGoal);
      // Progress/completion log lines arrive via the WebSocket broadcasts above.
    } catch (error) {
      setAgentLogs((prev) => [...prev, "❌ Error starting Browser Use agent process."]);
      setIsAgentRunning(false);
    }
  };

  const handleDismissNotification = async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const handleAddChecklistItem = async () => {
    const title = window.prompt("New checklist item title:");
    if (!title?.trim()) return;
    try {
      await createTask({ title: title.trim(), assignee: "user-1", checklist: [{ title: title.trim(), completed: false }] });
      fetchAll();
    } catch (error) {
      console.error("Error adding checklist item:", error);
    }
  };

  const handleToggleChecklistItem = async (taskId: string, itemIdx: number) => {
    const task = tasks.find((t) => t.task_id === taskId);
    if (!task) return;
    const updatedChecklist = task.checklist.map((item, idx) => (idx === itemIdx ? { ...item, completed: !item.completed } : item));
    try {
      const updated = await updateTask(taskId, { checklist: updatedChecklist });
      setTasks((prev) => prev.map((t) => (t.task_id === taskId ? updated : t)));
    } catch (error) {
      console.error("Error updating checklist item:", error);
    }
  };

  const flatChecklist = tasks.flatMap((task) =>
    task.checklist.map((item, idx) => ({ taskId: task.task_id, taskTitle: task.title, idx, ...item }))
  );
  const inProgressCount = tasks.filter((t) => t.status === "in-progress").length;
  const duplicateNotifications = notifications.filter((n) => n.type === "duplicate_found" && !n.read);
  const groupedGraphNodes = graph.nodes.reduce<Record<string, typeof graph.nodes>>((acc, node) => {
    (acc[node.type] ||= []).push(node);
    return acc;
  }, {});
  const nodeLabel = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Top Header Navigation */}
      <header className="glass-panel" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        margin: "16px",
        borderRadius: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: "#0b0f19"
          }}>T</div>
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 800, tracking: "-0.05em" }} className="gradient-text">TeamOS</h1>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Hackathon MVP Workspace</span>
          </div>
        </div>

        {/* Center Nav tabs */}
        <nav style={{ display: "flex", gap: "8px" }}>
          {["dashboard", "context-feed", "ai-agent", "knowledge-graph"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "rgba(0, 242, 254, 0.1)" : "transparent",
                color: activeTab === tab ? "var(--accent-blue)" : "var(--text-secondary)",
                border: activeTab === tab ? "1px solid rgba(0, 242, 254, 0.2)" : "1px solid transparent",
                padding: "8px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem",
                textTransform: "capitalize",
                transition: "all 0.2s"
              }}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </nav>

        {/* Workspace details & Invite */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Active Workspace</span>
            <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{workspace?.name ?? "Loading..."}</strong>
          </div>
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px dashed var(--border-glass)",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            Code: <strong style={{ color: "var(--accent-blue)" }}>{workspace?.workspace_id ?? DEMO_WORKSPACE_ID}</strong>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "300px 1fr 340px",
        gap: "16px",
        padding: "0 16px 16px 16px",
        overflow: "hidden"
      }}>
        {/* Left Side Panel - Live Presence Grid */}
        <section className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>Teammate Presence</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Real-time browser activity sync</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {members.map((member) => (
              <div key={member.user_id} className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: STATUS_DOT_COLOR[member.status] ?? "var(--text-muted)" }}></div>
                    <strong style={{ fontSize: "0.85rem" }}>{member.display_name}</strong>
                  </div>
                  <span style={{
                    fontSize: "0.7rem",
                    color: member.status === "busy" ? "var(--accent-red)" : "var(--accent-blue)",
                    background: member.status === "busy" ? "rgba(255,56,96,0.1)" : "rgba(0,242,254,0.1)",
                    padding: "2px 6px",
                    borderRadius: "4px"
                  }}>{STATUS_LABEL[member.status] ?? member.status}</span>
                </div>
                {member.current_activity && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    🎯 <span style={{ color: "var(--text-primary)" }}>{member.current_activity}</span>
                  </div>
                )}
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: "4px" }}>
                    <span>Sprint Progress</span>
                    <strong>{member.progress}%</strong>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${member.progress}%`, height: "100%", background: "linear-gradient(90deg, var(--accent-blue), var(--accent-purple))" }}></div>
                  </div>
                </div>
              </div>
            ))}

            {isAgentRunning && (
              <div className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%" }} className="status-online"></div>
                    <strong style={{ fontSize: "0.85rem" }}>🤖 Browser Use Agent</strong>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--accent-green)", background: "rgba(57,255,20,0.1)", padding: "2px 6px", borderRadius: "4px" }}>Running</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  🎯 <span style={{ color: "var(--text-primary)" }}>{agentGoal}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Center Main Tab View */}
        <section className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
          {activeTab === "dashboard" && (
            <>
              {/* Sprint Progress Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: "16px" }}>
                <div className="glass-panel" style={{ padding: "20px", background: "linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.05) 100%)" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px" }} className="gradient-text">Sprint Active Progress</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    Your team is currently executing <strong>{workspace?.projects?.[0] ?? "the current sprint"}</strong>. Total checklist items are at{" "}
                    <strong>{progress?.sprint_progress ?? 0}%</strong> completion.
                  </p>
                  <div style={{ marginTop: "16px", display: "flex", gap: "16px" }}>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>COMPLETED TASKS</span>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{progress?.completed_tasks ?? 0} / {progress?.total_tasks ?? 0}</div>
                    </div>
                    <div style={{ width: "1px", background: "var(--border-glass)" }}></div>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>IN PROGRESS</span>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b" }}>{inProgressCount}</div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    border: "8px solid rgba(0,242,254,0.1)",
                    borderTopColor: "var(--accent-blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative"
                  }}>
                    <strong style={{ fontSize: "1.2rem" }}>{progress?.sprint_progress ?? 0}%</strong>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "8px" }}>Overall Progress</span>
                </div>
              </div>

              {/* Sprint Tasks Checklists */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Sprint Checklist</h3>
                  <button onClick={handleAddChecklistItem} className="glass-panel" style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border-glass)",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <IconPlus /> Add Item
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {flatChecklist.length === 0 && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No checklist items yet. Add one to get started.</div>
                  )}
                  {flatChecklist.map((item) => (
                    <div
                      key={`${item.taskId}-${item.idx}`}
                      onClick={() => handleToggleChecklistItem(item.taskId, item.idx)}
                      className="glass-panel"
                      style={{
                        padding: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.01)",
                        cursor: "pointer"
                      }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: item.completed ? "none" : "1px solid var(--text-muted)",
                          background: item.completed ? "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#0b0f19"
                        }}>
                          {item.completed && <IconCheck />}
                        </div>
                        <span style={{
                          fontSize: "0.8rem",
                          color: item.completed ? "var(--text-secondary)" : "var(--text-primary)",
                          textDecoration: item.completed ? "line-through" : "none"
                        }}>
                          {item.title}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{item.taskTitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "context-feed" && (
            <>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>Shared Context & Activity Feed</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {duplicateNotifications.map((notification) => (
                    <div key={notification.notification_id} className="glass-panel" style={{
                      padding: "12px 16px",
                      background: "rgba(255,56,96,0.05)",
                      borderColor: "rgba(255,56,96,0.2)",
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start"
                    }}>
                      <IconAlert />
                      <div>
                        <strong style={{ fontSize: "0.8rem", color: "var(--accent-red)", display: "block" }}>Smart Document Intel: Duplicate Alert</strong>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-primary)", marginTop: "2px" }}>{notification.message}</p>
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button onClick={() => handleDismissNotification(notification.notification_id)} style={{
                            background: "transparent",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-glass)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.7rem",
                            cursor: "pointer"
                          }}>Dismiss</button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {feed.length === 0 && duplicateNotifications.length === 0 && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No shared knowledge yet. Share your first webpage.</div>
                  )}

                  {feed.map((item) => (
                    <div key={item.context_id} className="glass-panel" style={{ padding: "16px", background: "rgba(255,255,255,0.01)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "0.8rem" }}>{item.created_by}</strong>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>shared {item.type}</span>
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{formatRelativeTime(item.created_at)}</span>
                      </div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-blue)", marginBottom: "4px" }}>
                        {item.title}
                      </div>
                      {item.summary && (
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "8px", lineHeight: "1.4" }}>
                          {item.summary}
                        </p>
                      )}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          🔗 {item.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "ai-agent" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Autonomous AI Research Agent</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Outsource browsing workflows to Browser Use agents</p>
                </div>

                <div className="glass-panel" style={{ padding: "16px", background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>AGENT GOAL / TASK INSTRUCTION</label>
                      <input
                        type="text"
                        value={agentGoal}
                        onChange={e => setAgentGoal(e.target.value)}
                        style={{
                          width: "100%",
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--border-glass)",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          color: "#fff",
                          fontSize: "0.8rem"
                        }}
                      />
                    </div>

                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      Uses GEMINI_API_KEY or OPENAI_API_KEY configured on the backend; falls back to a local extractive summarizer when no key is set.
                    </p>

                    <button
                      onClick={handleRunAgent}
                      disabled={isAgentRunning || !agentGoal.trim()}
                      style={{
                        background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)",
                        color: "#0b0f19",
                        border: "none",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        opacity: isAgentRunning ? 0.6 : 1
                      }}
                    >
                      <IconPlay /> {isAgentRunning ? "Running Autonomous Agent..." : "Run Autonomous Agent"}
                    </button>
                  </div>
                </div>

                {(isAgentRunning || agentLogs.length > 0) && (
                  <div className="glass-panel" style={{
                    padding: "14px",
                    background: "#000",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: "#38bdf8",
                    minHeight: "150px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid #1e293b", paddingBottom: "6px", marginBottom: "8px" }}>
                      <IconTerminal /> <span>Agent Execution Terminal Logs</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {agentLogs.map((log, idx) => (
                        <div key={idx} style={{ color: log.includes("✅") ? "var(--accent-green)" : "#94a3b8" }}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "knowledge-graph" && (
            <>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "4px" }}>Extracted Entity Knowledge Graph</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "16px" }}>Relationships generated from context feeds</p>

                {graph.nodes.length === 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No shared knowledge yet. Share your first webpage.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {Object.entries(groupedGraphNodes).map(([type, nodes]) => {
                      const palette = GRAPH_TYPE_COLOR[type] ?? { color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)" };
                      return (
                        <div key={type} className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.01)" }}>
                          <span style={{ fontSize: "0.65rem", color: palette.color, background: palette.bg, padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                            {type.toUpperCase()}
                          </span>
                          <ul style={{ listStyle: "none", fontSize: "0.75rem", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            {nodes.map((node) => <li key={node.id}>{node.label}</li>)}
                          </ul>
                        </div>
                      );
                    })}

                    <div className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.01)" }}>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>RELATIONSHIPS</span>
                      <ul style={{ listStyle: "none", fontSize: "0.7rem", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {graph.edges.map((edge, idx) => (
                          <li key={idx}>{nodeLabel(edge.source)} ➡️ {edge.relation} ➡️ {nodeLabel(edge.target)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Right Side Panel - AI Search & Quick Actions */}
        <section className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
          {/* AI Search Section */}
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px" }}>AI Workspace Search</h3>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Ask anything about workspace context..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "8px",
                  padding: "10px 12px 10px 36px",
                  color: "#fff",
                  fontSize: "0.8rem",
                  transition: "all 0.2s"
                }}
              />
              <div style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }}>
                <IconSearch />
              </div>
            </div>
            {searchResults !== null && (
              searchResults.length === 0 ? (
                <div className="glass-panel" style={{ padding: "12px", marginTop: "10px", fontSize: "0.75rem", background: "rgba(0,0,0,0.2)" }}>
                  No matches found for "{searchQuery}".
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                  {searchResults.slice(0, 3).map((result) => (
                    <div key={result.context_id} className="glass-panel" style={{ padding: "12px", fontSize: "0.75rem", background: "rgba(0,0,0,0.2)", lineHeight: "1.4" }}>
                      💡 <strong>{result.title}</strong>
                      {result.summary && <div style={{ color: "var(--text-secondary)", marginTop: "4px" }}>{result.summary}</div>}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Quick Actions Panel */}
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>Quick Control Center</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="glass-panel" style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-glass)",
                padding: "12px",
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: wsStatus === "open" ? "var(--accent-green)" : "var(--accent-red)" }}>
                  📡 WebSocket Presence Cache
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  {wsStatus === "open" ? "Connected — receiving live events" : "Disconnected — falling back to polling"}
                </span>
              </div>

              <div className="glass-panel" style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-glass)",
                padding: "12px",
                borderRadius: "10px",
                opacity: 0.6,
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-purple)" }}>🗄️ HydraDB Vector Similarities</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Not yet connected — pending HydraDB credentials in .env.</span>
              </div>

              <div className="glass-panel" style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-glass)",
                padding: "12px",
                borderRadius: "10px",
                opacity: 0.6,
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-green)" }}>⚡ Force Sync Browser Tabs</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Not implemented in this MVP (FR-48/49).</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Info */}
      <footer style={{
        padding: "12px 24px",
        textAlign: "center",
        fontSize: "0.7rem",
        color: "var(--text-muted)",
        borderTop: "1px solid var(--border-glass)"
      }}>
        TeamOS Browser Operating System • Hackathon Demo Version 0.1.0 • Connected to {API_BASE_URL}
      </footer>
    </div>
  );
}
