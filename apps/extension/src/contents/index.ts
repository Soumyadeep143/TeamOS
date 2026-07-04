declare const chrome: any;

console.log("TeamOS content script loaded!");

function attachTeamOSButton() {
  let root = document.getElementById("teamos-root");
  if (!root && document.body) {
    root = document.createElement("div");
    root.id = "teamos-root";
    root.style.position = "fixed";
    root.style.top = "0";
    root.style.right = "-400px"; // Hidden by default offscreen
    root.style.width = "400px";
    root.style.height = "100vh";
    root.style.zIndex = "999999";
    root.style.transition = "right 0.3s ease";
    root.style.boxShadow = "-2px 0 8px rgba(0,0,0,0.15)";
    root.style.backgroundColor = "#0f172a";
    
    // Inject sidepanel iframe
    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("sidepanel.html");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    
    root.appendChild(iframe);
    document.body.appendChild(root);
  }
  return root;
}

chrome.runtime.onMessage.addListener(
  (
    message: any,
    sender: any,
    sendResponse: (response?: any) => void
  ) => {
    console.log("TeamOS content script received message:", message);
    if (message?.type === "TOGGLE_SIDEBAR") {
      console.log("Toggling sidebar status...");
      const root = attachTeamOSButton();
      if (root) {
        if (root.style.right === "0px") {
          console.log("Hiding sidebar...");
          root.style.right = "-400px";
        } else {
          console.log("Showing sidebar...");
          root.style.right = "0px";
        }
      }
      sendResponse({ success: true });
    }
  }
);

export {};
