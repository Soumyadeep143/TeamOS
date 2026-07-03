declare const chrome: any;

chrome.runtime.onInstalled.addListener(() => {
  // Production-ready service worker installation hook
});

chrome.runtime.onMessage.addListener(
  (
    message: any,
    sender: any,
    sendResponse: (response?: any) => void
  ) => {
    if (message?.type === "PING") {
      sendResponse({ type: "PONG" });
    }
  }
);

export {};
