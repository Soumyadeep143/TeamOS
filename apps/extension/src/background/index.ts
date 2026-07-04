import { shareContext, updateMemberPresence } from "@teamos/sdk";

declare const chrome: any;

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
    await updateMemberPresence("user-1", {
      current_activity: currentActivity,
      status: "online"
    });
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

// Captures a screenshot of the currently visible tab (FR-9, FR-61). Fails
// silently on restricted pages (chrome://, PDF viewer, etc) since
// captureVisibleTab throws there — sharing should still proceed without one.
async function captureScreenshot(windowId: number): Promise<string | undefined> {
  try {
    return await chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 70 });
  } catch (error) {
    console.warn("Screenshot capture unavailable for this page:", error);
    return undefined;
  }
}

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info: any, tab: any) => {
  if (!tab?.url) return;

  const type = info.menuItemId === "share-selection" ? "highlight" : "page";
  const title = tab.title || "Shared Page";
  const textContent = info.selectionText || "";
  const screenshot = await captureScreenshot(tab.windowId);

  try {
    await shareContext({
      type,
      title,
      url: tab.url,
      text_content: textContent,
      metadata: screenshot ? { screenshot } : undefined
    });

    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/icon.png"),
      title: "TeamOS Shared!",
      message: `Successfully shared ${type === "highlight" ? "highlighted text" : "webpage"} to the team.`
    });
  } catch (error) {
    console.error("Error sharing context menu:", error);
  }
});
