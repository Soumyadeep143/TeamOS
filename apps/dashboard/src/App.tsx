import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type Workspace = {
  workspace_id: string;
  name: string;
  description: string;
  members: string[];
  projects: string[];
};

type Member = {
  user_id: string;
  display_name: string;
  status: string;
  current_activity: string;
  progress: number;
};

type ChecklistItem = {
  title: string;
  completed: boolean;
};

type TaskItem = {
  task_id: string;
  title: string;
  status: string;
  progress: number;
  assignee?: string | null;
  checklist: ChecklistItem[];
};

type FeedItem = {
  context_id: string;
  title: string;
  summary?: string;
  url?: string;
  type: string;
  created_by: string;
  created_at: string;
};

type TimelineEvent = {
  event_id: string;
  timestamp: string;
  user: string;
  user_id: string;
  type: string;
  message: string;
  details: Record<string, any>;
};

type WlaData = {
  workspace_id: string;
  overloaded_members: Array<{
    user_id: string;
    display_name: string;
    active_tasks_count: number;
    total_tasks_count: number;
    reason: string;
  }>;
  idle_members: Array<{
    user_id: string;
    display_name: string;
    status: string;
    reason: string;
  }>;
  meeting_suggestions: Array<{
    day: string;
    start_time: string;
    end_time: string;
    available_count: number;
    recommendation: string;
  }>;
  overlap_summary: string;
};

type HeatmapData = {
  workspace_id: string;
  heatmap: Record<string, number[]>;
  total_members: number;
};

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

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

export function App() {
  const [activeTab, setActiveTab] = useState("workspace");
  const [searchQuery, setSearchQuery] = useState("");
  const [agentGoal, setAgentGoal] = useState("Research competitor features and sync it with TeamOS");
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");

  // Active user simulation roles (user-1 is Soumyadeep, user-2 is John Doe)
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return localStorage.getItem("teamos_active_user_id") || "user-1";
  });

  // Workspace lists management
  const [workspaceList, setWorkspaceList] = useState<Array<{ id: string; name: string }>>(() => {
    const saved = localStorage.getItem("teamos_workspaces");
    return saved ? JSON.parse(saved) : [{ id: "demo-workspace-123", name: "TeamOS Demo Workspace" }];
  });
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(() => {
    return localStorage.getItem("teamos_active_workspace_id") || "demo-workspace-123";
  });

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timeline & WLA state
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineUserFilter, setTimelineUserFilter] = useState("");
  const [timelineTypeFilter, setTimelineTypeFilter] = useState("");
  const [wlaData, setWlaData] = useState<WlaData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);

  // Forms state
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsDesc, setNewWsDesc] = useState("");
  const [joinInviteCode, setJoinInviteCode] = useState("");

  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskSubItems, setNewTaskSubItems] = useState<string[]>([]);
  const [subItemInput, setSubItemInput] = useState("");

  // Sync state with localstorage
  useEffect(() => {
    localStorage.setItem("teamos_active_user_id", activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    localStorage.setItem("teamos_workspaces", JSON.stringify(workspaceList));
  }, [workspaceList]);

  useEffect(() => {
    localStorage.setItem("teamos_active_workspace_id", currentWorkspaceId);
    void loadWorkspaceData();
  }, [currentWorkspaceId]);

  // Load timeline when filters change
  useEffect(() => {
    void loadTimelineEvents();
  }, [timelineUserFilter, timelineTypeFilter, currentWorkspaceId]);

  const loadTimelineEvents = async () => {
    try {
      let url = `${API_BASE}/timeline/?workspace_id=${currentWorkspaceId}&`;
      if (timelineUserFilter) url += `user_id=${timelineUserFilter}&`;
      if (timelineTypeFilter) url += `event_type=${timelineTypeFilter}&`;

      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${viewingAs}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTimelineEvents(data);
      }
    } catch (err) {
      console.error("Failed to load timeline events", err);
    }
  };

  const loadWorkspaceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authHeaders = { "Authorization": `Bearer ${viewingAs}` };
      const [workspaceRes, membersRes, tasksRes, feedRes, wlaRes, heatmapRes] = await Promise.all([
        fetch(`${API_BASE}/workspace/${currentWorkspaceId}`, { headers: authHeaders }),
        fetch(`${API_BASE}/workspace/${currentWorkspaceId}/members`, { headers: authHeaders }),
        fetch(`${API_BASE}/task/?workspace_id=${currentWorkspaceId}`, { headers: authHeaders }),
        fetch(`${API_BASE}/context/feed?workspace_id=${currentWorkspaceId}`, { headers: authHeaders }),
        fetch(`${API_BASE}/analytics/wla?workspace_id=${currentWorkspaceId}`, { headers: authHeaders }),
        fetch(`${API_BASE}/analytics/heatmap?workspace_id=${currentWorkspaceId}`, { headers: authHeaders })
      ]);

      if (!workspaceRes.ok || !membersRes.ok || !tasksRes.ok || !feedRes.ok) {
        throw new Error("Workspace details not found or connection issues.");
      }

      const workspaceData = await workspaceRes.json();
      const membersData = await membersRes.json();
      const tasksData = await tasksRes.json();
      const feedData = await feedRes.json();
      const wlaDataObj = wlaRes.ok ? await wlaRes.json() : null;
      const heatmapDataObj = heatmapRes.ok ? await heatmapRes.json() : null;

      setWorkspace(workspaceData);
      setMembers(membersData);
      setTasks(tasksData);
      setFeed(feedData);
      setWlaData(wlaDataObj);
      setHeatmapData(heatmapDataObj);

      await loadTimelineEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load workspace data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-assign a task to a user
  const handleReassignTask = async (taskId: string, assigneeId: string) => {
    try {
      const response = await fetch(`${API_BASE}/task/${taskId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${viewingAs}`
        },
        body: JSON.stringify({ assignee: assigneeId || null })
      });

      if (!response.ok) {
        throw new Error("Failed to reassign task");
      }

      await loadWorkspaceData();
    } catch (err) {
      alert("Error reassigning task: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Toggle checklist subitem completion status
  const handleToggleChecklistItem = async (taskId: string, itemIndex: number) => {
    const task = tasks.find(t => t.task_id === taskId);
    if (!task) return;

    const updatedChecklist = task.checklist.map((item, idx) =>
      idx === itemIndex ? { ...item, completed: !item.completed } : item
    );

    try {
      const response = await fetch(`${API_BASE}/task/${taskId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${viewingAs}`
        },
        body: JSON.stringify({ checklist: updatedChecklist })
      });

      if (!response.ok) {
        throw new Error("Failed to update checklist progress");
      }

      await loadWorkspaceData();
    } catch (err) {
      alert("Error updating checklist: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Create workspace handler
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/workspace/create`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${viewingAs}`
        },
        body: JSON.stringify({ name: newWsName, description: newWsDesc })
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }

      const newWorkspace = await response.json();
      const updatedList = [...workspaceList, { id: newWorkspace.workspace_id, name: newWorkspace.name }];
      setWorkspaceList(updatedList);
      setCurrentWorkspaceId(newWorkspace.workspace_id);
      
      setNewWsName("");
      setNewWsDesc("");
      setShowWorkspaceForm(false);
    } catch (err) {
      alert("Error creating workspace: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Join workspace handler
  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInviteCode.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/workspace/join`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${viewingAs}`
        },
        body: JSON.stringify({ invite_code: joinInviteCode })
      });

      if (!response.ok) {
        throw new Error("Invite code not found or invalid");
      }

      const joinedWorkspace = await response.json();
      // Add if not already in list
      if (!workspaceList.some(w => w.id === joinedWorkspace.workspace_id)) {
        const updatedList = [...workspaceList, { id: joinedWorkspace.workspace_id, name: joinedWorkspace.name }];
        setWorkspaceList(updatedList);
      }
      setCurrentWorkspaceId(joinedWorkspace.workspace_id);
      
      setJoinInviteCode("");
      setShowJoinForm(false);
    } catch (err) {
      alert("Error joining workspace: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Add Task subitem helper
  const handleAddSubItem = () => {
    if (subItemInput.trim()) {
      setNewTaskSubItems(prev => [...prev, subItemInput.trim()]);
      setSubItemInput("");
    }
  };

  // Remove Task subitem helper
  const handleRemoveSubItem = (idx: number) => {
    setNewTaskSubItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Create Task handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const checklistItems = newTaskSubItems.map(title => ({ title, completed: false }));
      const response = await fetch(`${API_BASE}/task/?workspace_id=${currentWorkspaceId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${viewingAs}`
        },
        body: JSON.stringify({
          title: newTaskTitle,
          assignee: newTaskAssignee || null,
          checklist: checklistItems
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      setNewTaskTitle("");
      setNewTaskAssignee("");
      setNewTaskSubItems([]);
      setShowAddTaskForm(false);
      await loadWorkspaceData();
    } catch (err) {
      alert("Error creating task: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const searchAnswer = useMemo(() => {
    if (!searchQuery.trim()) return "";
    const query = searchQuery.toLowerCase();
    if (query.includes("task") || query.includes("progress")) {
      return `The workspace currently has ${tasks.length} tracked tasks. The average progress across all tasks is ${
        tasks.length > 0
          ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
          : 0
      }%.`;
    }
    if (query.includes("context") || query.includes("feed")) {
      return `There are ${feed.length} context items in the shared feed.`;
    }
    if (query.includes("workload") || query.includes("overload")) {
      const count = wlaData?.overloaded_members.length ?? 0;
      return `Workload Analysis reports ${count} overloaded teammates. ${
        count > 0 ? wlaData?.overloaded_members.map(m => m.display_name).join(", ") : "All members look balanced."
      }`;
    }
    return `The live TeamOS backend reports ${members.length} active members and ${tasks.length} active tasks for ${workspace?.name ?? "the current workspace"}.`;
  }, [feed.length, members, searchQuery, tasks, workspace?.name, wlaData]);

  const handleRunAgent = async () => {
    setIsAgentRunning(true);
    setAgentLogs(["🤖 Submitting the research request to the TeamOS backend..."]);

    try {
      const response = await fetch(`${API_BASE}/ai/run?workspace_id=${currentWorkspaceId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${viewingAs}`
        },
        body: JSON.stringify({ goal: agentGoal, model: selectedModel })
      });

      if (!response.ok) {
        throw new Error("The AI workflow did not complete successfully.");
      }

      const result = await response.json();
      setAgentLogs((prev) => [
        ...prev,
        `✅ ${result.message}`,
        `🧠 Model: ${result.model}`,
        `📦 Shared context: ${result.context_id}`
      ]);
      await loadWorkspaceData();
    } catch (err) {
      setAgentLogs((prev) => [...prev, `⚠️ ${err instanceof Error ? err.message : "Agent run failed"}`]);
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Overall workspace progress calculation
  const overallProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  }, [tasks]);

  return (
    <div className="app-shell">
      {/* Upper Navigation Header */}
      <header className="glass-panel app-header" style={{ padding: "14px 20px" }}>
        <div className="brand-block">
          <div className="brand-mark">T</div>
          <div>
            <h1 className="gradient-text app-title">TeamOS</h1>
            <span className="app-subtitle">Live workspace operating system</span>
          </div>
        </div>

        <nav className="top-nav">
          {[
            { key: "workspace", label: "Workspace" },
            { key: "feed", label: "Context Feed" },
            { key: "timeline", label: "Timeline Events" },
            { key: "agents", label: "AI Agents" },
            { key: "graph", label: "Knowledge Graph" }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`nav-pill ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Workspace Switcher & Invites */}
        <div className="workspace-meta" style={{ gap: "16px" }}>
          <div className="workspace-summary" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span className="meta-label">Active Workspace</span>
            <select
              value={currentWorkspaceId}
              onChange={(e) => setCurrentWorkspaceId(e.target.value)}
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border-glass)",
                borderRadius: "8px",
                color: "#fff",
                padding: "4px 10px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {workspaceList.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="workspace-code" style={{ padding: "4px 10px", borderRadius: "8px" }}>
              Invite Code: <strong style={{ color: "var(--accent-blue)" }}>{workspace?.workspace_id ?? "connecting"}</strong>
            </div>
            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => { setShowWorkspaceForm(prev => !prev); setShowJoinForm(false); }}
                style={{ background: "transparent", border: "none", color: "var(--accent-blue)", fontSize: "0.7rem", cursor: "pointer", textDecoration: "underline" }}
              >
                + New
              </button>
              <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>|</span>
              <button 
                onClick={() => { setShowJoinForm(prev => !prev); setShowWorkspaceForm(false); }}
                style={{ background: "transparent", border: "none", color: "var(--accent-purple)", fontSize: "0.7rem", cursor: "pointer", textDecoration: "underline" }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Creation & Join forms */}
      {showWorkspaceForm && (
        <div className="glass-panel" style={{ padding: "16px", margin: "0 16px" }}>
          <form onSubmit={handleCreateWorkspace} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Workspace Name</label>
              <input 
                type="text" 
                placeholder="E.g., Hackathon Devs" 
                value={newWsName} 
                onChange={e => setNewWsName(e.target.value)} 
                required 
                style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "8px", color: "#fff" }}
              />
            </div>
            <div style={{ flex: 2, minWidth: "300px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Description</label>
              <input 
                type="text" 
                placeholder="E.g., Collaboration sandbox for project details" 
                value={newWsDesc} 
                onChange={e => setNewWsDesc(e.target.value)} 
                style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "8px", color: "#fff" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" className="primary-button" style={{ height: "38px" }}>Create</button>
              <button type="button" onClick={() => setShowWorkspaceForm(false)} className="ghost-button" style={{ height: "38px" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showJoinForm && (
        <div className="glass-panel" style={{ padding: "16px", margin: "0 16px" }}>
          <form onSubmit={handleJoinWorkspace} style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Invite Code / Workspace ID</label>
              <input 
                type="text" 
                placeholder="E.g., ws-abc123de" 
                value={joinInviteCode} 
                onChange={e => setJoinInviteCode(e.target.value)} 
                required 
                style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "8px", color: "#fff" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" className="primary-button" style={{ height: "38px" }}>Join</button>
              <button type="button" onClick={() => setShowJoinForm(false)} className="ghost-button" style={{ height: "38px" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid Section */}
      <main className="dashboard-grid">
        {/* Left sidebar: Presence */}
        <section className="glass-panel side-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 className="section-title">Teammate Presence</h2>
              <p className="section-copy">Real-time browser activity sync</p>
            </div>
            {/* View As Toggle simulator */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>View As</span>
              <select
                value={activeUserId}
                onChange={(e) => setActiveUserId(e.target.value)}
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "6px",
                  color: "var(--accent-blue)",
                  padding: "2px 6px",
                  fontSize: "0.75rem",
                  cursor: "pointer"
                }}
              >
                <option value="user-1">Soumyadeep (Me)</option>
                <option value="user-2">John Doe (Teammate)</option>
              </select>
            </div>
          </div>

          {error && <div className="answer-card" style={{ color: "var(--accent-red)" }}>{error}</div>}

          <div className="presence-list">
            {members.map((member) => (
              <div className={`presence-card ${member.user_id === activeUserId ? "active-member" : ""}`} 
                   key={member.user_id} 
                   style={{
                     border: member.user_id === activeUserId ? "1.5px solid rgba(0, 242, 254, 0.4)" : "1px solid var(--border-glass)",
                     background: member.user_id === activeUserId ? "rgba(0, 242, 254, 0.03)" : "rgba(255, 255, 255, 0.025)"
                   }}>
                <div className="presence-head">
                  <div className="presence-name-row">
                    <div className={`status-dot ${member.status === "busy" ? "status-busy" : "status-online"}`}></div>
                    <strong>{member.display_name} {member.user_id === activeUserId && "(You)"}</strong>
                  </div>
                  <span className={`status-tag ${member.status === "busy" ? "focus" : "active"}`}>{member.status}</span>
                </div>
                <div className="presence-body">{member.current_activity}</div>
                <div className="presence-link" style={{ fontSize: "0.7rem" }}>ID: {member.user_id}</div>
                <div className="progress-row" style={{ marginTop: "10px" }}>
                  <span>Workflow progress</span>
                  <strong>{member.progress}%</strong>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" data-progress style={{ ["--progress-width" as string]: `${member.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Center Panel */}
        <section className="glass-panel main-panel">
          {activeTab === "workspace" && (
            <>
              {/* Sprint circular ring overview */}
              <div className="hero-card">
                <div>
                  <h3 className="gradient-text hero-title">Live execution status</h3>
                  <p className="hero-copy">{workspace?.description || "The TeamOS workspace is connected to the backend and ready to run tasks."}</p>
                </div>
                <div className="progress-ring">
                  <strong>{overallProgress}%</strong>
                </div>
              </div>

              {/* Workload Analysis and Availability overlap section */}
              {wlaData && (
                <div className="stack-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700 }} className="gradient-text">Workload & Sync Analysis</h3>
                  
                  {/* Overload Alerts */}
                  {(wlaData.overloaded_members.length > 0 || wlaData.idle_members.length > 0) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {wlaData.overloaded_members.map(m => (
                        <div key={m.user_id} className="alert-card" style={{ padding: "8px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
                          <IconAlert />
                          <span style={{ fontSize: "0.75rem" }}>
                            <strong>{m.display_name}</strong> is overloaded! Reason: {m.reason} ({m.active_tasks_count} active / {m.total_tasks_count} total).
                          </span>
                        </div>
                      ))}
                      {wlaData.idle_members.map(m => (
                        <div key={m.user_id} className="alert-card" style={{ padding: "8px 12px", display: "flex", gap: "8px", alignItems: "center", border: "1px solid rgba(79, 172, 254, 0.2)", background: "rgba(79, 172, 254, 0.05)" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--accent-purple)" }}>
                            😴 <strong>{m.display_name}</strong> is idle ({m.status}). Reason: {m.reason} Suggested: assign tasks.
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Meeting Recommendations */}
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Suggested Overlap Sync Windows:</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                      {wlaData.meeting_suggestions.map((s, idx) => (
                        <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          📅 <strong>{s.day}</strong>: {s.start_time} - {s.end_time} ({s.available_count} members overlapping availability).
                        </div>
                      ))}
                      {wlaData.meeting_suggestions.length === 0 && (
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>No shared overlapping times found between members.</div>
                      )}
                    </div>
                  </div>

                  {/* Availability Heatmap grid */}
                  {heatmapData && heatmapData.heatmap && (
                    <div style={{ marginTop: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Weekly Availability Heatmap (24 Hours):</span>
                      <div style={{
                        marginTop: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        background: "rgba(0,0,0,0.2)",
                        padding: "10px",
                        borderRadius: "8px"
                      }}>
                        {Object.entries(heatmapData.heatmap).map(([day, hours]) => (
                          <div key={day} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "60px", fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "right" }}>{day.substring(0, 3)}</span>
                            <div style={{ display: "flex", gap: "2px", flex: 1 }}>
                              {hours.map((val, hIdx) => {
                                let opacity = 0.05;
                                if (val === 1) opacity = 0.35;
                                if (val === 2) opacity = 0.7;
                                if (val >= 3) opacity = 1.0;
                                
                                return (
                                  <div
                                    key={hIdx}
                                    title={`${day} ${hIdx}:00 - ${val} member(s) available`}
                                    style={{
                                      height: "10px",
                                      flex: 1,
                                      background: `rgba(0, 242, 254, ${opacity})`,
                                      border: "1px solid rgba(255,255,255,0.01)",
                                      borderRadius: "2px"
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "68px", fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          <span>12 AM</span>
                          <span>6 AM</span>
                          <span>12 PM</span>
                          <span>6 PM</span>
                          <span>11 PM</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sprint Checklist Card */}
              <div className="stack-card">
                <div className="section-head" style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Sprint checklist</h3>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setShowAddTaskForm(prev => !prev)} className="ghost-button" type="button" style={{ padding: "6px 12px", borderRadius: "8px" }}>
                      <IconPlus /> Add Task
                    </button>
                    <button onClick={loadWorkspaceData} className="ghost-button" type="button" style={{ padding: "6px 12px", borderRadius: "8px" }}>
                      Sync
                    </button>
                  </div>
                </div>

                {/* Add Task Form collapsible */}
                {showAddTaskForm && (
                  <div className="glass-panel" style={{ padding: "16px", marginBottom: "16px", background: "rgba(255,255,255,0.01)" }}>
                    <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Task Title</label>
                        <input 
                          type="text" 
                          placeholder="E.g., Connect WebSocket listener" 
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          required
                          style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "8px", color: "#fff" }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Assignee</label>
                          <select 
                            value={newTaskAssignee}
                            onChange={e => setNewTaskAssignee(e.target.value)}
                            style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "8px", color: "#fff" }}
                          >
                            <option value="">Select teammate</option>
                            {members.map(m => (
                              <option key={m.user_id} value={m.user_id}>{m.display_name} ({m.user_id})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Sub-checklist creator */}
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Checklist Sub-items</label>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                          <input 
                            type="text" 
                            placeholder="Add sub-task..."
                            value={subItemInput}
                            onChange={e => setSubItemInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddSubItem(); } }}
                            style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "8px", color: "#fff" }}
                          />
                          <button type="button" onClick={handleAddSubItem} className="ghost-button" style={{ height: "38px" }}>Add</button>
                        </div>
                        {newTaskSubItems.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: "8px" }}>
                            {newTaskSubItems.map((item, idx) => (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                                <span>• {item}</span>
                                <button type="button" onClick={() => handleRemoveSubItem(idx)} style={{ background: "transparent", border: "none", color: "var(--accent-red)", cursor: "pointer" }}>
                                  <IconTrash />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignSelf: "flex-end" }}>
                        <button type="submit" className="primary-button" style={{ padding: "8px 16px" }}>Save Task</button>
                        <button type="button" onClick={() => setShowAddTaskForm(false)} className="ghost-button" style={{ padding: "8px 16px" }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Checklist Task items list */}
                <div className="checklist-list" style={{ gap: "14px" }}>
                  {tasks.map((task) => {
                    const isAssignedToActive = task.assignee === activeUserId;
                    return (
                      <div key={task.task_id} className="checklist-task-card" style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border: isAssignedToActive ? "1.5px solid rgba(0, 242, 254, 0.25)" : "1px solid var(--border-glass)",
                        background: isAssignedToActive ? "rgba(0,242,254,0.01)" : "rgba(255,255,255,0.01)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                      }}>
                        {/* Upper row: Title, status, assignee */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <div className={`check-badge ${task.progress === 100 ? "done" : ""}`} style={{ width: "20px", height: "20px" }}>
                                {task.progress === 100 && <IconCheck />}
                              </div>
                              <strong style={{ fontSize: "0.9rem", color: task.progress === 100 ? "var(--text-secondary)" : "var(--text-primary)" }}>
                                {task.title}
                              </strong>
                              {isAssignedToActive && (
                                <span style={{
                                  fontSize: "0.65rem",
                                  color: "var(--accent-blue)",
                                  background: "rgba(0,242,254,0.12)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontWeight: 600
                                }}>Assigned to You</span>
                              )}
                            </div>
                            <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>ID: {task.task_id}</span>
                          </div>
                          
                          {/* Reassign dropdown and status */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                              <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "2px" }}>Assignee</span>
                              <select 
                                value={task.assignee || ""}
                                onChange={(e) => handleReassignTask(task.task_id, e.target.value)}
                                style={{
                                  background: "rgba(0,0,0,0.3)",
                                  color: "var(--text-secondary)",
                                  border: "1px solid var(--border-glass)",
                                  borderRadius: "4px",
                                  padding: "2px 6px",
                                  fontSize: "0.75rem",
                                  cursor: "pointer"
                                }}
                              >
                                <option value="">Unassigned</option>
                                {members.map(m => (
                                  <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
                                ))}
                              </select>
                            </div>
                            <span className={`status-tag ${task.status === "completed" ? "active" : "focus"}`} style={{ height: "fit-content", padding: "4px 8px" }}>
                              {task.status}
                            </span>
                          </div>
                        </div>

                        {/* Middle row: Progress bar */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                            <span>Sub-tasks progress</span>
                            <strong>{task.progress}%</strong>
                          </div>
                          <div className="progress-bar" style={{ marginTop: 0 }}>
                            <div className="progress-fill" data-progress style={{ ["--progress-width" as string]: `${task.progress}%` }}></div>
                          </div>
                        </div>

                        {/* Bottom: Sub-checklist items checkboxes */}
                        {task.checklist && task.checklist.length > 0 && (
                          <div style={{
                            padding: "10px 14px",
                            background: "rgba(0,0,0,0.15)",
                            borderRadius: "10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                          }}>
                            {task.checklist.map((item, itemIdx) => (
                              <label 
                                key={itemIdx} 
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  cursor: "pointer",
                                  fontSize: "0.8rem",
                                  color: item.completed ? "var(--text-muted)" : "var(--text-secondary)"
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={item.completed} 
                                  onChange={() => handleToggleChecklistItem(task.task_id, itemIdx)}
                                  style={{
                                    accentColor: "var(--accent-blue)",
                                    width: "14px",
                                    height: "14px",
                                    cursor: "pointer"
                                  }}
                                />
                                <span style={{ textDecoration: item.completed ? "line-through" : "none" }}>
                                  {item.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {tasks.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      No tasks found. Click "Add Task" to create one.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "feed" && (
            <div className="stack-card">
              <h3 className="section-title">Shared context feed</h3>
              <div className="feed-list">
                {feed.map((item) => (
                  <div className="feed-item" key={item.context_id}>
                    <div className="feed-meta-row">
                      <strong>{item.created_by}</strong>
                      <span>{item.type} • {new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <div className="feed-title">{item.title}</div>
                    <p>{item.summary}</p>
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>}
                  </div>
                ))}
                {feed.length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                    No context shared yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="stack-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 className="section-title">Chronological timeline events</h3>
                  <p className="section-copy">Interactive logs representing workspace history (sprint audit log)</p>
                </div>
                
                {/* Event Filters */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    value={timelineUserFilter}
                    onChange={e => setTimelineUserFilter(e.target.value)}
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "#fff", padding: "4px 8px", fontSize: "0.75rem" }}
                  >
                    <option value="">All Members</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
                    ))}
                    <option value="system">System</option>
                  </select>
                  
                  <select
                    value={timelineTypeFilter}
                    onChange={e => setTimelineTypeFilter(e.target.value)}
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "#fff", padding: "4px 8px", fontSize: "0.75rem" }}
                  >
                    <option value="">All Event Types</option>
                    <option value="workspace_create">Workspace Created</option>
                    <option value="member_join">Member Joined</option>
                    <option value="task_update">Task Updates</option>
                    <option value="context_share">Context Shares</option>
                  </select>
                </div>
              </div>

              {/* Timeline chronological list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {timelineEvents.map((evt) => (
                  <div key={evt.event_id} className="feed-item" style={{ borderLeft: "3px solid var(--accent-blue)", paddingLeft: "12px", background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                      <span><strong>{evt.user}</strong> ({evt.user_id})</span>
                      <span>{new Date(evt.timestamp).toLocaleTimeString()} · {evt.type}</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{evt.message}</div>
                    {evt.details && Object.keys(evt.details).length > 0 && (
                      <pre style={{
                        marginTop: "8px",
                        fontSize: "0.7rem",
                        background: "rgba(0,0,0,0.2)",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        overflowX: "auto",
                        color: "var(--text-secondary)"
                      }}>
                        {JSON.stringify(evt.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
                {timelineEvents.length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No matching timeline events found.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "agents" && (
            <div className="stack-card">
              <h3 className="section-title">Autonomous AI research</h3>
              <p className="section-copy">Run browser-based research tasks and capture the outputs in the workspace.</p>
              <div className="form-grid">
                <div>
                  <label htmlFor="agent-goal">Agent goal</label>
                  <input id="agent-goal" value={agentGoal} onChange={(e) => setAgentGoal(e.target.value)} placeholder="Describe the research task" />
                </div>
                <div>
                  <label htmlFor="model-provider">Model provider</label>
                  <select id="model-provider" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gpt-4o">GPT-4o</option>
                  </select>
                </div>
              </div>
              <button className="primary-button agent-button" onClick={handleRunAgent} disabled={isAgentRunning} type="button">
                <IconPlay /> {isAgentRunning ? "Agent is running..." : "Run autonomous agent"}
              </button>

              {(isAgentRunning || agentLogs.length > 0) && (
                <div className="terminal-card">
                  <div className="terminal-head"><IconTerminal /> Agent execution log</div>
                  <div className="terminal-body">
                    {agentLogs.map((log, idx) => (
                      <div key={idx} className={log.includes("✅") ? "terminal-success" : "terminal-muted"}>{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "graph" && (
            <div className="stack-card">
              <h3 className="section-title">Knowledge graph</h3>
              <p className="section-copy">Structured entities and relationships discovered from shared workspace context.</p>
              <div className="graph-grid">
                <div className="graph-card">
                  <span className="graph-label blue">People</span>
                  <ul>
                    {members.map((member) => <li key={member.user_id}>{member.display_name}</li>)}
                  </ul>
                </div>
                <div className="graph-card">
                  <span className="graph-label purple">Technologies</span>
                  <ul>
                    <li>FastAPI · Backend API</li>
                    <li>Redis · Presence and events</li>
                    <li>Plasmo · Browser extension</li>
                  </ul>
                </div>
                <div className="graph-card">
                  <span className="graph-label green">Products</span>
                  <ul>
                    <li>Browser Use</li>
                    <li>HydraDB</li>
                  </ul>
                </div>
                <div className="graph-card">
                  <span className="graph-label muted">Relationships</span>
                  <ul>
                    {feed.slice(0, 3).map((item) => <li key={item.context_id}>{item.title}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right sidebar */}
        <section className="glass-panel side-panel">
          <h3 className="section-title">Search and control center</h3>
          <div className="search-box">
            <IconSearch />
            <input
              type="text"
              placeholder="Ask the workspace about context or tasks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <div className="answer-card">
              <strong>Suggested answer:</strong> {searchAnswer}
            </div>
          )}

          <div className="quick-actions">
            <button onClick={loadWorkspaceData} className="action-card" type="button">
              <span>Backend health</span>
              <small>Sync and verify the TeamOS API is answering requests.</small>
            </button>
            <button onClick={() => setActiveTab("feed")} className="action-card" type="button">
              <span>Live context feed</span>
              <small>See the latest shared workspace items as they arrive.</small>
            </button>
            <button onClick={() => setActiveTab("timeline")} className="action-card" type="button">
              <span>Timeline events</span>
              <small>Audit chronological logging logs and member presence events.</small>
            </button>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        TeamOS workspace operating system • End-to-end MVP • Connected to {API_BASE}
      </footer>
    </div>
  );
}
