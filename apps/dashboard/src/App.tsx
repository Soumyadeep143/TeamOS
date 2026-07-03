import React, { useState, useEffect } from "react";

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

export function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [agentGoal, setAgentGoal] = useState("Extract competitor pricing matrices");
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");

  // Simulated agent run
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAgentRunning) {
      const logs = [
        "🤖 AI Agent: Initiating workspace context...",
        "🌐 Navigation: Connecting to target URL (github.com/browser-use)...",
        "📂 Scraper: Locating pricing documentation tables...",
        "📊 Processing: Parsing pricing points into JSON structures...",
        "🔍 Comparison: Calculating vector similarity against existing items...",
        "✅ Completed: Competitor Analysis matrix generated successfully!"
      ];
      let step = 0;
      setAgentLogs([logs[0]]);
      interval = setInterval(() => {
        step++;
        if (step < logs.length) {
          setAgentLogs(prev => [...prev, logs[step]]);
        } else {
          setIsAgentRunning(false);
          clearInterval(interval);
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isAgentRunning]);

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
            <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>TeamOS Demo Workspace</strong>
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
            Code: <strong style={{ color: "var(--accent-blue)" }}>demo-workspace-123</strong>
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
            {/* User 1 */}
            <div className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%" }} className="status-online"></div>
                  <strong style={{ fontSize: "0.85rem" }}>Soumyadeep</strong>
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--accent-blue)", background: "rgba(0,242,254,0.1)", padding: "2px 6px", borderRadius: "4px" }}>Active</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                🎯 <span style={{ color: "var(--text-primary)" }}>Researching Browser Use</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                🔗 github.com/browser-use/browser-use
              </div>
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: "4px" }}>
                  <span>Sprint Progress</span>
                  <strong>78%</strong>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: "78%", height: "100%", background: "linear-gradient(90deg, var(--accent-blue), var(--accent-purple))" }}></div>
                </div>
              </div>
            </div>

            {/* User 2 */}
            <div className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%" }} className="status-busy"></div>
                  <strong style={{ fontSize: "0.85rem" }}>John Doe</strong>
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--accent-red)", background: "rgba(255,56,96,0.1)", padding: "2px 6px", borderRadius: "4px" }}>Focus Mode</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                🎯 <span style={{ color: "var(--text-primary)" }}>Editing workspace_service.py</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                🔗 C:\Users\dell\TeamOs\apps\backend\app\services...
              </div>
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: "4px" }}>
                  <span>Sprint Progress</span>
                  <strong>45%</strong>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: "45%", height: "100%", background: "linear-gradient(90deg, var(--accent-blue), var(--accent-purple))" }}></div>
                </div>
              </div>
            </div>

            {/* AI Agent Alpha */}
            <div className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%" }} className="status-online"></div>
                  <strong style={{ fontSize: "0.85rem" }}>🤖 Agent Alpha</strong>
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--accent-green)", background: "rgba(57,255,20,0.1)", padding: "2px 6px", borderRadius: "4px" }}>Running</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                🎯 <span style={{ color: "var(--text-primary)" }}>Analyzing pricing pages</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                🔗 vercel.com/pricing
              </div>
            </div>
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
                    Your team is currently executing sprint <strong>Hackathon MVP</strong>. Total checklist items are at 74% completion. Keep it up!
                  </p>
                  <div style={{ marginTop: "16px", display: "flex", gap: "16px" }}>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>COMPLETED TASKS</span>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>4 / 6</div>
                    </div>
                    <div style={{ width: "1px", background: "var(--border-glass)" }}></div>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>ACTIVE BLOCKERS</span>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-red)" }}>1 Blocker</div>
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
                    <strong style={{ fontSize: "1.2rem" }}>74%</strong>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "8px" }}>Overall Progress</span>
                </div>
              </div>

              {/* Sprint Tasks Checklists */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Sprint Checklist</h3>
                  <button className="glass-panel" style={{
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
                  {[
                    { title: "Define custom styling tokens in index.css", completed: true },
                    { title: "Create index.html entrypoint for Vite Dashboard", completed: true },
                    { title: "Fix pyproject.toml PEP 621 compliance scripts", completed: true },
                    { title: "Resolve psycopg[binary] dependency versions", completed: true },
                    { title: "Implement live tab broadcast service worker", completed: false, badge: "In Progress" },
                    { title: "Create merge similarity validation checks in HydraDB", completed: false }
                  ].map((task, idx) => (
                    <div key={idx} className="glass-panel" style={{
                      padding: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.01)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: task.completed ? "none" : "1px solid var(--text-muted)",
                          background: task.completed ? "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#0b0f19"
                        }}>
                          {task.completed && <IconCheck />}
                        </div>
                        <span style={{
                          fontSize: "0.8rem",
                          color: task.completed ? "var(--text-secondary)" : "var(--text-primary)",
                          textDecoration: task.completed ? "line-through" : "none"
                        }}>
                          {task.title}
                        </span>
                      </div>
                      {task.badge && (
                        <span style={{
                          fontSize: "0.65rem",
                          color: "var(--accent-blue)",
                          background: "rgba(0,242,254,0.1)",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>{task.badge}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "context-feed" && (
            <>
              {/* Shared Context Feed list */}
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>Shared Context & Activity Feed</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Duplicate Alert */}
                  <div className="glass-panel" style={{
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
                      <p style={{ fontSize: "0.75rem", color: "var(--text-primary)", marginTop: "2px" }}>
                        Shared document <strong>"competitor-pricing-v2.pdf"</strong> matches <strong>"competitor-analysis-draft.pdf"</strong> with a <strong>89% similarity matching score</strong>.
                      </p>
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button style={{
                          background: "var(--accent-red)",
                          color: "#fff",
                          border: "none",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}>Compare Files</button>
                        <button style={{
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

                  {/* Share item 1 */}
                  <div className="glass-panel" style={{ padding: "16px", background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "0.8rem" }}>Soumyadeep</strong>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>shared page</span>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>10 minutes ago</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-blue)", marginBottom: "4px" }}>
                      Browser Use Competitor Analysis
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "8px", lineHeight: "1.4" }}>
                      GitHub repository for Browser Use agent framework. Contains documentation and setup scripts.
                    </p>
                    <a href="https://github.com/browser-use/browser-use" target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      🔗 github.com/browser-use/browser-use
                    </a>
                  </div>

                  {/* Share item 2 */}
                  <div className="glass-panel" style={{ padding: "16px", background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "0.8rem" }}>John Doe</strong>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>shared selection</span>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>22 minutes ago</span>
                    </div>
                    <div style={{
                      background: "rgba(255,255,255,0.02)",
                      borderLeft: "3px solid var(--accent-purple)",
                      padding: "8px 12px",
                      fontSize: "0.75rem",
                      fontStyle: "italic",
                      color: "var(--text-secondary)",
                      lineHeight: "1.4"
                    }}>
                      "Team plans cost $49/month with unlimited connected agents, while business plans scale up to $199/month."
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "ai-agent" && (
            <>
              {/* AI Agent Console */}
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

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>MODEL PROVIDER</label>
                        <select 
                          value={selectedModel}
                          onChange={e => setSelectedModel(e.target.value)}
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.2)",
                            border: "1px solid var(--border-glass)",
                            borderRadius: "8px",
                            padding: "8px",
                            color: "#fff",
                            fontSize: "0.8rem"
                          }}
                        >
                          <option value="gemini-1.5-flash">Gemini 1.5 Flash (Default)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                          <option value="gpt-4o">GPT-4o (OpenAI)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>MAX TABS LIMIT</label>
                        <input 
                          type="number" 
                          defaultValue="5"
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.2)",
                            border: "1px solid var(--border-glass)",
                            borderRadius: "8px",
                            padding: "8px",
                            color: "#fff",
                            fontSize: "0.8rem"
                          }}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => setIsAgentRunning(true)}
                      disabled={isAgentRunning}
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

                {/* Simulated Terminal logs */}
                {isAgentRunning || agentLogs.length > 0 ? (
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
                ) : null}
              </div>
            </>
          )}

          {activeTab === "knowledge-graph" && (
            <>
              {/* Extracted Knowledge Graph entities */}
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "4px" }}>Extracted Entity Knowledge Graph</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "16px" }}>Relationships generated from context feeds</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.01)" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--accent-blue)", background: "rgba(0,242,254,0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>PERSONS</span>
                    <ul style={{ listStyle: "none", fontSize: "0.75rem", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <li>👤 Soumyadeep (Lead Dev)</li>
                      <li>👤 John Doe (Researcher)</li>
                    </ul>
                  </div>

                  <div className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.01)" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--accent-purple)", background: "rgba(79,172,254,0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>TECHNOLOGIES</span>
                    <ul style={{ listStyle: "none", fontSize: "0.75rem", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <li>⚙️ FastAPI (Backend API)</li>
                      <li>⚙️ Redis (Pub/Sub)</li>
                      <li>⚙️ Plasmo (Extension)</li>
                    </ul>
                  </div>

                  <div className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.01)" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--accent-green)", background: "rgba(57,255,20,0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>PRODUCTS / API</span>
                    <ul style={{ listStyle: "none", fontSize: "0.75rem", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <li>📦 Browser Use</li>
                      <li>📦 HydraDB</li>
                    </ul>
                  </div>

                  <div className="glass-panel" style={{ padding: "12px", background: "rgba(255,255,255,0.01)" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>RELATIONSHIPS</span>
                    <ul style={{ listStyle: "none", fontSize: "0.7rem", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <li>Soumyadeep ➡️ researches ➡️ Browser Use</li>
                      <li>John Doe ➡️ edits ➡️ FastAPI modules</li>
                    </ul>
                  </div>
                </div>
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
            {searchQuery && (
              <div className="glass-panel" style={{ padding: "12px", marginTop: "10px", fontSize: "0.75rem", background: "rgba(0,0,0,0.2)", lineHeight: "1.4" }}>
                💡 <strong>Suggested Answer:</strong> Browser Use is currently set up under the `/services/browser-use/` path and is being researched by Soumyadeep.
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>Quick Control Center</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button className="glass-panel" style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-glass)",
                padding: "12px",
                borderRadius: "10px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-blue)" }}>📡 WebSocket Presence Cache</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Verify connection to backend event pub/sub.</span>
              </button>

              <button className="glass-panel" style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-glass)",
                padding: "12px",
                borderRadius: "10px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-purple)" }}>🗄️ HydraDB Vector Similarities</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Verify indexed vector similarity graphs.</span>
              </button>

              <button className="glass-panel" style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-glass)",
                padding: "12px",
                borderRadius: "10px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-green)" }}>⚡ Force Sync Browser Tabs</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Align active browser sessions across team.</span>
              </button>
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
        TeamOS Browser Operating System • Hackathon Demo Version 0.1.0 • Connected to http://localhost:8000
      </footer>
    </div>
  );
}
