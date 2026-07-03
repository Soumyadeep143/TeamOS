declare const chrome: any;

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("open-sidepanel");
  if (button) {
    button.addEventListener("click", () => {
      // Send message to active tab to open side panel
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, { type: "TOGGLE_SIDEBAR" }, (response: any) => {
            if (chrome.runtime.lastError) {
              console.warn("Could not send message to tab:", chrome.runtime.lastError.message);
              // Fallback: alert the user or open dashboard
              chrome.tabs.create({ url: "http://localhost:5173" });
            }
          });
        }
      });
    });
  }
});
export {};
