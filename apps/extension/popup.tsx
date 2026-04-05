import { useEffect, useState } from "react";
import axios from "axios";
import { clearJwtToken, getJwtToken } from "~lib/storage";

const API_BASE = process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:4000/v1";

type AuthState = "loading" | "logged_in" | "logged_out";
type TabSnapshot = {
  title: string;
  url: string;
};

function IndexPopup() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [displayName, setDisplayName] = useState<string>("there");
  const [activeTab, setActiveTab] = useState<TabSnapshot | null>(null);
  const [note, setNote] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((name) => name !== tagName) : [...prev, tagName]
    );
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabUrl = tab?.url ?? "";
        if (tabUrl) {
          setActiveTab({
            title: tab?.title || "Untitled page",
            url: tabUrl,
          });
        }
      } catch {
        // Ignore tab-read failures in restricted browser pages.
      }

      const token = await getJwtToken();
      if (!token) {
        setAuthState("logged_out");
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const name = response?.data?.name;
        const email = response?.data?.email;
        setDisplayName((typeof name === "string" && name.trim()) || email || "there");
        setAuthState("logged_in");

        const tagsResponse = await axios.get(`${API_BASE}/tags`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const names = Array.isArray(tagsResponse?.data)
          ? tagsResponse.data
              .map((tag: { name?: unknown }) => (typeof tag?.name === "string" ? tag.name.trim() : ""))
              .filter((name: string) => name.length > 0)
              .slice(0, 8)
          : [];
        setTagSuggestions(names);
      } catch {
        await clearJwtToken();
        setAuthState("logged_out");
      }
    };

    void bootstrap();
  }, []);

  const openAuthPage = async () => {
    const authPageUrl = chrome.runtime.getURL("tabs/auth.html");
    await chrome.tabs.create({ url: authPageUrl });
  };

  const handleLogout = async () => {
    await clearJwtToken();
    setAuthState("logged_out");
  };

  const handleSave = async () => {
    setSaveMessage(null);
    setSaveError(null);

    if (!activeTab?.url) {
      setSaveError("No active tab URL found. Open a normal web page and try again.");
      return;
    }

    const token = await getJwtToken();
    if (!token) {
      setAuthState("logged_out");
      setSaveError("Session expired. Please login again.");
      return;
    }

    try {
      setIsSaving(true);
      await axios.post(
        `${API_BASE}/items`,
        {
          url: activeTab.url,
          note: note.trim() || undefined,
          saveSource: "extension",
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSaveMessage("Saved! Processing...");
      setNote("");
      setSelectedTags([]);
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.error ||
        requestError?.message ||
        "Failed to save this page.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        width: 360,
        minHeight: 320,
        padding: 16,
        fontFamily: "Segoe UI, sans-serif",
      }}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>Recall Saver</h2>

      {authState === "loading" ? <p>Checking login state...</p> : null}

      {authState === "logged_out" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ margin: 0 }}>You are not logged in.</p>
          <button
            type="button"
            onClick={openAuthPage}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              background: "#0ea5e9",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}>
            Login to Recall
          </button>
        </div>
      ) : null}

      {authState === "logged_in" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ margin: 0 }}>Signed in as {displayName}.</p>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 10,
              background: "#f9fafb",
            }}>
            <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#111827" }}>
              {activeTab?.title || "Current page"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#4b5563",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
              {activeTab?.url || "No active tab URL"}
            </p>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Quick note (optional)</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Why did you save this?"
              style={{
                resize: "vertical",
                padding: 10,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontFamily: "inherit",
              }}
            />
          </label>

          {tagSuggestions.length > 0 ? (
            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#374151" }}>Quick tags</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tagSuggestions.map((tagName) => {
                  const isSelected = selectedTags.includes(tagName);
                  return (
                    <button
                      key={tagName}
                      type="button"
                      onClick={() => toggleTag(tagName)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: isSelected ? "1px solid #0284c7" : "1px solid #d1d5db",
                        background: isSelected ? "#e0f2fe" : "#ffffff",
                        color: "#111827",
                        fontSize: 12,
                        cursor: "pointer",
                      }}>
                      {tagName}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              background: "#0ea5e9",
              color: "#ffffff",
              fontWeight: 600,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}>
            {isSaving ? "Saving..." : "Save to Recall"}
          </button>

          {saveMessage ? <p style={{ margin: 0, color: "#047857" }}>{saveMessage}</p> : null}
          {saveError ? <p style={{ margin: 0, color: "#b91c1c" }}>{saveError}</p> : null}

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              cursor: "pointer",
            }}>
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default IndexPopup;
