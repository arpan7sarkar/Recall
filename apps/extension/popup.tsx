import { useEffect, useState } from "react";
import axios from "axios";
import { clearJwtToken, getJwtToken, setJwtToken } from "~lib/storage";

const API_BASE = process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:4000/v1";

const COLORS = {
  bg: "#fafafa",
  secondaryBg: "#ffffff",
  text: "#18181b",
  mutedText: "#52525b",
  accent: "#334155",
  border: "rgba(0, 0, 0, 0.08)",
  inputBg: "#f4f4f5",
  success: "#059669",
  error: "#dc2626",
};

type AuthState = "loading" | "connected" | "disconnected";
type UserInfo = { name?: string; email?: string };
type TabSnapshot = { title: string; url: string };

function IndexPopup() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState<TabSnapshot | null>(null);
  const [note, setNote] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Token paste states
  const [tokenInput, setTokenInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((name) => name !== tagName) : [...prev, tagName]
    );
  };

  useEffect(() => {
    const bootstrap = async () => {
      // Get active tab
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          setActiveTab({ title: tab.title || "Untitled page", url: tab.url });
        }
      } catch {
        // Restricted pages
      }

      // Check stored token
      const token = await getJwtToken();
      if (!token) {
        setAuthState("disconnected");
        return;
      }

      // Validate the stored token
      try {
        const res = await axios.post(`${API_BASE}/auth/extension/validate`, { token });
        if (res.data?.valid && res.data?.user) {
          setUser(res.data.user);
          setAuthState("connected");

          // Fetch tags
          try {
            const tagsRes = await axios.get(`${API_BASE}/tags`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const names = Array.isArray(tagsRes?.data)
              ? tagsRes.data
                  .map((tag: any) => (typeof tag?.name === "string" ? tag.name.trim() : ""))
                  .filter((n: string) => n.length > 0)
                  .slice(0, 8)
              : [];
            setTagSuggestions(names);
          } catch {
            // Tags fetch failed — non-critical
          }
        } else {
          await clearJwtToken();
          setAuthState("disconnected");
        }
      } catch {
        await clearJwtToken();
        setAuthState("disconnected");
      }
    };

    void bootstrap();
  }, []);

  const handleTokenSubmit = async () => {
    const cleanToken = tokenInput.trim();
    setTokenError(null);

    if (!cleanToken) {
      setTokenError("Please paste your access token.");
      return;
    }

    if (!cleanToken.startsWith("recall_ext_")) {
      setTokenError("Invalid token format. Tokens start with 'recall_ext_'.");
      return;
    }

    setIsValidating(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/extension/validate`, { token: cleanToken });
      if (res.data?.valid && res.data?.user) {
        await setJwtToken(cleanToken);
        setUser(res.data.user);
        setAuthState("connected");
        setTokenInput("");
      } else {
        setTokenError("Token validation failed.");
      }
    } catch (err: any) {
      setTokenError(err?.response?.data?.error || "Invalid or expired token.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleDisconnect = async () => {
    await clearJwtToken();
    setUser(null);
    setAuthState("disconnected");
    setTagSuggestions([]);
    setSelectedTags([]);
  };

  const handleSave = async () => {
    setSaveMessage(null);
    setSaveError(null);

    if (!activeTab?.url) {
      setSaveError("No active tab URL found.");
      return;
    }

    const token = await getJwtToken();
    if (!token) {
      setAuthState("disconnected");
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSaveMessage("Saved successfully!");
      setNote("");
      setSelectedTags([]);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (requestError: any) {
      const errorMsg = requestError?.response?.data?.error || "Failed to save.";
      if (requestError?.response?.status === 401) {
        await clearJwtToken();
        setAuthState("disconnected");
        setSaveError("Token expired or revoked. Please reconnect.");
      } else {
        setSaveError(errorMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        width: 320,
        padding: "20px",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
          Recall
        </h1>
        {authState === "connected" && (
          <button
            onClick={handleDisconnect}
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              background: "none",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              color: COLORS.mutedText,
              cursor: "pointer",
            }}
          >
            Disconnect
          </button>
        )}
      </header>

      {/* Loading */}
      {authState === "loading" && (
        <div style={{ padding: "20px 0", textAlign: "center", color: COLORS.mutedText }}>
          <span style={{ fontSize: "13px" }}>Verifying connection...</span>
        </div>
      )}

      {/* Disconnected — Token Paste */}
      {authState === "disconnected" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              background: COLORS.secondaryBg,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔗</div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: "14px",
                fontWeight: 600,
                color: COLORS.text,
              }}
            >
              Connect your account
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: COLORS.mutedText, lineHeight: 1.5 }}>
              Generate an access token from your{" "}
              <a
                href="http://localhost:3000/dashboard/settings"
                target="_blank"
                style={{ color: COLORS.accent, textDecoration: "none", fontWeight: 600 }}
              >
                dashboard settings
              </a>
              , then paste it below.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste your access token here..."
              rows={3}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: `1px solid ${COLORS.border}`,
                background: COLORS.inputBg,
                fontSize: "12px",
                fontFamily: "monospace",
                resize: "none",
                outline: "none",
                color: COLORS.text,
              }}
            />
            <button
              onClick={handleTokenSubmit}
              disabled={isValidating}
              style={{
                padding: "10px",
                background: COLORS.accent,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: isValidating ? "not-allowed" : "pointer",
                opacity: isValidating ? 0.7 : 1,
                transition: "0.2s",
              }}
            >
              {isValidating ? "Validating..." : "Connect"}
            </button>
          </div>

          {tokenError && (
            <div
              style={{
                fontSize: "12px",
                color: COLORS.error,
                textAlign: "center",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#fef2f2",
                border: "1px solid #fee2e2",
              }}
            >
              {tokenError}
            </div>
          )}
        </div>
      )}

      {/* Connected — Save UI */}
      {authState === "connected" && (
        <main style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* User badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "#ecfdf5",
              border: "1px solid #d1fae5",
            }}
          >
            <span style={{ fontSize: "14px" }}>✓</span>
            <span style={{ fontSize: "12px", color: "#059669", fontWeight: 500 }}>
              Connected as {user?.name || user?.email || "User"}
            </span>
          </div>

          {/* Active tab */}
          <div
            style={{
              padding: "12px",
              background: COLORS.secondaryBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: COLORS.text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: "4px",
              }}
            >
              {activeTab?.title || "No page detected"}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: COLORS.mutedText,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activeTab?.url || "Navigate to a page to save it"}
            </div>
          </div>

          {/* Note */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: COLORS.mutedText }}>
              Notes
            </label>
            <textarea
              placeholder="Add a quick note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: `1px solid ${COLORS.border}`,
                background: COLORS.inputBg,
                fontSize: "13px",
                fontFamily: "inherit",
                resize: "none",
                minHeight: "50px",
                outline: "none",
                color: COLORS.text,
              }}
            />
          </div>

          {/* Tags */}
          {tagSuggestions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: COLORS.mutedText }}>
                Tags
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      cursor: "pointer",
                      border: "none",
                      background: selectedTags.includes(tag) ? COLORS.accent : COLORS.border,
                      color: selectedTags.includes(tag) ? "#fff" : COLORS.text,
                      transition: "0.2s",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: "10px",
              background: COLORS.accent,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.7 : 1,
              transition: "0.2s",
            }}
          >
            {isSaving ? "Saving..." : "Save to Recall"}
          </button>

          {saveMessage && (
            <div
              style={{
                fontSize: "12px",
                color: COLORS.success,
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              {saveMessage}
            </div>
          )}
          {saveError && (
            <div
              style={{
                fontSize: "12px",
                color: COLORS.error,
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              {saveError}
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: "4px",
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: "12px",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "11px", color: COLORS.mutedText }}>
          Manage tokens in your{" "}
          <a
            href="http://localhost:3000/dashboard/settings"
            target="_blank"
            style={{ color: COLORS.accent, textDecoration: "none", fontWeight: 600 }}
          >
            Settings
          </a>
        </span>
      </footer>
    </div>
  );
}

export default IndexPopup;
