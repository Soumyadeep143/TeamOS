import React from "react";

function IndexPopup() {
  const openSidePanel = () => {
    console.log("Open Side Panel button clicked!");
    // Send message to active tab to open side panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      console.log("Active tab queried:", activeTab);
      if (activeTab?.id) {
        console.log("Sending TOGGLE_SIDEBAR message to tab ID:", activeTab.id);
        chrome.tabs.sendMessage(activeTab.id, { type: "TOGGLE_SIDEBAR" }, (response) => {
          console.log("Message response received:", response);
          if (chrome.runtime.lastError) {
            console.warn("Could not send message to tab:", chrome.runtime.lastError.message);
            // Fallback: alert the user or open dashboard
            chrome.tabs.create({ url: "http://localhost:5173" });
          }
        });
      } else {
        console.error("No active tab ID found!");
      }
    });
  };

  return (
    <div
      style={{
        width: "300px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        padding: "16px",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        boxSizing: "border-box"
      }}>
      <h3 style={{ marginTop: 0, color: "#38bdf8" }}>TeamOS</h3>
      <p style={{ fontSize: "14px", color: "#94a3b8" }}>AI-powered browser extension for teams.</p>
      <button
        onClick={openSidePanel}
        style={{
          width: "100%",
          backgroundColor: "#0284c7",
          color: "white",
          border: "none",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: 600
        }}>
        Open Side Panel
      </button>
    </div>
  );
}

export default IndexPopup;
