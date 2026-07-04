import React, { useState } from "react";
import { runAI } from "@teamos/sdk";
import type { AIRunResult, WorkspaceEvent } from "@teamos/types";
import { useWorkspaceSocket } from "../hooks/useWorkspaceSocket";

interface LogMessage {
  sender: "user" | "agent";
  text: string;
  timestamp: string;
}

const timestamp = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function AI() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([
    {
      sender: "agent",
      text: "Hello! I am your AI Browser Use assistant. Give me a task like 'Research competitors' or 'Monitor pricing pages' and I will operate Chrome to compile insights.",
      timestamp: timestamp()
    }
  ]);

  const appendLog = (text: string) =>
    setLogs((prev) => [...prev, { sender: "agent", text, timestamp: timestamp() }]);

  // Real progress log lines driven by the backend's AI_STARTED/AI_COMPLETED/AI_FAILED
  // broadcasts (see apps/backend/app/api/ai.py) instead of a scripted setTimeout demo.
  useWorkspaceSocket((message: WorkspaceEvent) => {
    if (message.event === "AI_STARTED") {
      const startedPrompt = (message.data as { prompt?: string })?.prompt;
      appendLog(`Launching Browser Use agent for: "${startedPrompt ?? prompt}"`);
    } else if (message.event === "AI_COMPLETED") {
      const result = (message.data as { data?: AIRunResult })?.data;
      appendLog(result?.summary ? `Done: ${result.summary}` : "AI research completed.");
      setRunning(false);
    } else if (message.event === "AI_FAILED") {
      appendLog("AI agent run failed. Check the backend logs and try again.");
      setRunning(false);
    }
  });

  const handleLaunchAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || running) return;

    const currentPrompt = prompt;
    setLogs((prev) => [...prev, { sender: "user", text: currentPrompt, timestamp: timestamp() }]);
    setPrompt("");
    setRunning(true);

    try {
      await runAI(currentPrompt);
      // Completion/failure log lines arrive via the WebSocket broadcasts above.
    } catch (error) {
      appendLog("Error starting Browser Use agent process. Please ensure backend is running.");
      setRunning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", gap: "12px" }}>
      {/* Log Console Output */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
        {logs.map((log, idx) => {
          const isUser = log.sender === "user";
          return (
            <div
              key={idx}
              style={{
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "85%",
                backgroundColor: isUser ? "#3b82f6" : "#1e293b",
                color: isUser ? "white" : "#e2e8f0",
                padding: "8px 12px",
                borderRadius: isUser ? "12px 12px 0 12px" : "12px 12px 12px 0",
                fontSize: "12px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}>
              <div style={{ wordBreak: "break-word", lineHeight: "1.4" }}>{log.text}</div>
              <div style={{ alignSelf: "flex-end", fontSize: "9px", color: isUser ? "#bfdbfe" : "#94a3b8" }}>
                {log.timestamp}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Form */}
      <form onSubmit={handleLaunchAgent} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Research competitor matrices..."
          disabled={running}
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
          disabled={running || !prompt.trim()}
          style={{
            backgroundColor: running || !prompt.trim() ? "#475569" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: prompt.trim() ? "pointer" : "default"
          }}>
          {running ? "Running" : "Launch"}
        </button>
      </form>
    </div>
  );
}
