import React, { useState } from "react";
import { Team } from "./sidepanel/Team";
import { Feed } from "./sidepanel/Feed";
import { Tasks } from "./sidepanel/Tasks";
import { AI } from "./sidepanel/AI";
import { Dashboard } from "./sidepanel/Dashboard";
import { Knowledge } from "./sidepanel/Knowledge";
import { Search } from "./sidepanel/Search";
import { Timeline } from "./sidepanel/Timeline";

type Tab = "dashboard" | "presence" | "feed" | "tasks" | "ai" | "knowledge" | "search" | "timeline";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: "🏠" },
  { id: "presence", label: "Team", icon: "👥" },
  { id: "feed", label: "Feed", icon: "🌐" },
  { id: "tasks", label: "Tasks", icon: "📋" },
  { id: "ai", label: "AI Agent", icon: "🤖" },
  { id: "knowledge", label: "Graph", icon: "🧠" },
  { id: "search", label: "Search", icon: "🔎" },
  { id: "timeline", label: "Timeline", icon: "🕒" },
];

function Sidepanel() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "presence":
        return <Team />;
      case "feed":
        return <Feed />;
      case "tasks":
        return <Tasks />;
      case "ai":
        return <AI />;
      case "knowledge":
        return <Knowledge />;
      case "search":
        return <Search />;
      case "timeline":
        return <Timeline />;
      default:
        return <Dashboard />;
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
          overflowX: "auto"
        }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: "1 0 auto",
              minWidth: "56px",
              background: "none",
              border: "none",
              color: activeTab === tab.id ? "#38bdf8" : "#64748b",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              fontSize: "10px",
              fontWeight: activeTab === tab.id ? 600 : 500,
              transition: "color 0.2s",
              padding: "2px 4px"
            }}>
            <span style={{ fontSize: "16px" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Sidepanel;
