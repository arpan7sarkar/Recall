import { getJwtToken } from "~lib/storage";

const API_BASE = process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:4000/v1";
const SAVE_CONTEXT_MENU_ID = "recall-save-to-recall";

function notify(message: string) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "assets/icon.png",
    title: "Recall Saver",
    message,
  });
}

function isValidWebUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

async function saveUrlToRecall(url: string) {
  const token = await getJwtToken();
  if (!token) {
    notify("Login required. Open the extension and sign in first.");
    return;
  }

  const response = await fetch(`${API_BASE}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url,
      saveSource: "extension",
    }),
  });

  if (!response.ok) {
    let errorMessage = "Unable to save this page.";
    try {
      const data = await response.json();
      if (typeof data?.error === "string" && data.error.trim().length > 0) {
        errorMessage = data.error;
      }
    } catch {
      // Ignore JSON parsing failures.
    }
    notify(errorMessage);
    return;
  }

  notify("Saved to Recall!");
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: SAVE_CONTEXT_MENU_ID,
      title: "Save to Recall",
      contexts: ["page", "link"],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== SAVE_CONTEXT_MENU_ID) return;

  const candidateUrl = info.linkUrl ?? info.pageUrl ?? tab?.url;
  if (!isValidWebUrl(candidateUrl)) {
    notify("This page cannot be saved.");
    return;
  }

  void saveUrlToRecall(candidateUrl);
});
