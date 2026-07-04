declare const chrome: any;

const API_BASE_URL = "http://localhost:8000";

// Set up Context Menus on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "share-page",
    title: "Share entire page to Team",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "share-selection",
    title: "Share selected text to Team",
    contexts: ["selection"]
  });
});

// Broadcast active tab details to backend
let lastUrl = "";
let lastTitle = "";
let isDebouncing = false;

async function updatePresence(url: string, title: string) {
  if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
    return;
  }
  
  // Format current activity message
  const domain = new URL(url).hostname;
  const currentActivity = `Active on ${domain} (Researching: ${title.slice(0, 30)})`;

  try {
    const response = await fetch(`${API_BASE_URL}/member/user-1`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        current_activity: currentActivity,
        status: "online"
      })
    });
    if (!response.ok) {
      console.error("Failed to update presence:", response.statusText);
    }
  } catch (error) {
    console.error("Error updating presence:", error);
  }
}

// Listen for tab activation changes
chrome.tabs.onActivated.addListener((activeInfo: any) => {
  chrome.tabs.get(activeInfo.tabId, (tab: any) => {
    if (chrome.runtime.lastError || !tab) return;
    if (tab.url && (tab.url !== lastUrl || tab.title !== lastTitle)) {
      lastUrl = tab.url;
      lastTitle = tab.title || "";
      debounceUpdate(lastUrl, lastTitle);
    }
  });
});

// Listen for tab updates (e.g. navigation)
chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: any, tab: any) => {
  if (changeInfo.status === "complete" && tab.active) {
    if (tab.url && (tab.url !== lastUrl || tab.title !== lastTitle)) {
      lastUrl = tab.url;
      lastTitle = tab.title || "";
      debounceUpdate(lastUrl, lastTitle);
    }
  }
});

function debounceUpdate(url: string, title: string) {
  if (isDebouncing) return;
  isDebouncing = true;
  setTimeout(() => {
    updatePresence(url, title);
    isDebouncing = false;
  }, 3000); // 3-second debounce
}

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info: any, tab: any) => {
  if (!tab?.url) return;

  const type = info.menuItemId === "share-selection" ? "highlight" : "page";
  const title = tab.title || "Shared Page";
  const textContent = info.selectionText || "";

  try {
    const response = await fetch(`${API_BASE_URL}/context/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: type,
        title: title,
        url: tab.url,
        text_content: textContent
      })
    });

    if (response.ok) {
      // Show desktop notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("assets/icon.png"),
        title: "TeamOS Shared!",
        message: `Successfully shared ${type === "highlight" ? "highlighted text" : "webpage"} to the team.`
      });
    } else {
      console.error("Failed to share context:", response.statusText);
    }
  } catch (error) {
    console.error("Error sharing context menu:", error);
  }
});
