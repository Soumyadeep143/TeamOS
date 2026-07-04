import React, { useState } from "react";
import { Team } from "./sidepanel/Team";
import { Feed } from "./sidepanel/Feed";
import { Tasks } from "./sidepanel/Tasks";
import { AI } from "./sidepanel/AI";

type Tab = "presence" | "feed" | "tasks" | "ai";

function Sidepanel() {
  const [activeTab, setActiveTab] = useState<Tab>("presence");

  const renderTabContent = () => {
    switch (activeTab) {
      case "presence":
        return <Team />;
      case "feed":
        return <Feed />;
      case "tasks":
        return <Tasks />;
      case "ai":
        return <AI />;
      default:
        return <Team />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        boxSizing: "border-box",
        overflow: "hidden"
      }}>
      {/* Workspace Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px",
          borderBottom: "1px solid #1e293b",
          backgroundColor: "#0f172a"
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>⚡</span>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "#38bdf8" }}>TeamOS</span>
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8", backgroundColor: "#1e293b", padding: "4px 8px", borderRadius: "12px" }}>
          Active Session
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          boxSizing: "border-box"
        }}>
        {renderTabContent()}
      </div>

      {/* Bottom Navigation Bar */}
      <div
        style={{
          display: "flex",
          borderTop: "1px solid #1e293b",
          backgroundColor: "#0f172a",
          padding: "6px 0",
          justifyContent: "space-around"
        }}>
        <button
          onClick={() => setActiveTab("presence")}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            color: activeTab === "presence" ? "#38bdf8" : "#64748b",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: activeTab === "presence" ? 600 : 500,
            transition: "color 0.2s"
          }}>
          <span style={{ fontSize: "18px" }}>👥</span>
          Team
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            color: activeTab === "feed" ? "#38bdf8" : "#64748b",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: activeTab === "feed" ? 600 : 500,
            transition: "color 0.2s"
          }}>
          <span style={{ fontSize: "18px" }}>🌐</span>
          Feed
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            color: activeTab === "tasks" ? "#38bdf8" : "#64748b",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: activeTab === "tasks" ? 600 : 500,
            transition: "color 0.2s"
          }}>
          <span style={{ fontSize: "18px" }}>📋</span>
          Tasks
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            color: activeTab === "ai" ? "#38bdf8" : "#64748b",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: activeTab === "ai" ? 600 : 500,
            transition: "color 0.2s"
          }}>
          <span style={{ fontSize: "18px" }}>🤖</span>
          AI Agent
        </button>
      </div>
    </div>
  );
}

export default Sidepanel;
