import { useEffect, useState } from "react";
import axios from "axios";
import { clearJwtToken, getJwtToken, setJwtToken } from "~lib/storage";

const API_BASE = process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:4000/v1";
const FRONTEND_BASE = process.env.PLASMO_PUBLIC_FRONTEND_URL ?? "http://localhost:3000";

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

// Content type options for the category picker
const CATEGORY_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "article", label: "Article / Blog" },
  { value: "youtube", label: "YouTube Video" },
  { value: "tweet", label: "Tweet / Post" },
  { value: "pdf", label: "PDF / Document" },
  { value: "podcast", label: "Podcast" },
  { value: "image", label: "Image" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "link", label: "Other Link" },
];

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
  const [collections, setCollections] = useState<{id: string, name: string}[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [isArchived, setIsArchived] = useState(false);

  // Manual URL input
  const [manualUrl, setManualUrl] = useState("");
  const [useManualUrl, setUseManualUrl] = useState(false);

  // Category selection
  const [category, setCategory] = useState("");

  // Token paste states
  const [tokenInput, setTokenInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((name) => name !== tagName) : [...prev, tagName]
    );
  };

  // Get the URL that will be saved
  const getSaveUrl = (): string => {
    if (useManualUrl && manualUrl.trim()) return manualUrl.trim();
    return activeTab?.url ?? "";
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
          await fetchTags(token);
          await fetchCollections(token);
        } else {
          // Only clear if explicitly invalid (not a network error)
          await clearJwtToken();
          setAuthState("disconnected");
        }
      } catch (err: any) {
        const status = err?.response?.status;
        // Only clear token for definitive auth failures (401)
        // Network errors or 500s should not clear the token
        if (status === 401) {
          await clearJwtToken();
          setAuthState("disconnected");
        } else {
          // Network error — still show as connected attempt failed
          setAuthState("disconnected");
        }
      }
    };

    void bootstrap();
  }, []);

  const fetchTags = async (token: string) => {
    try {
      const tagsRes = await axios.get(`${API_BASE}/tags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const names = Array.isArray(tagsRes?.data)
        ? tagsRes.data
            .map((tag: any) => (typeof tag?.name === "string" ? tag.name.trim() : ""))
            .filter((n: string) => n.length > 0)
            .slice(0, 12)
        : [];
      setTagSuggestions(names);
    } catch {
      // Tags fetch failed — non-critical
    }
  };

  const fetchCollections = async (token: string) => {
    try {
      const colsRes = await axios.get(`${API_BASE}/collections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(colsRes?.data)) {
        setCollections(colsRes.data.map(c => ({ id: c.id, name: c.name })));
      }
    } catch {
      // Collections fetch failed
    }
  };

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
        await fetchTags(cleanToken);
        await fetchCollections(cleanToken);
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
    setCollections([]);
    setSelectedCollection("");
    setIsArchived(false);
  };

  const handleSave = async () => {
    setSaveMessage(null);
    setSaveError(null);

    const urlToSave = getSaveUrl();

    if (!urlToSave) {
      setSaveError("Enter a URL or navigate to a page to save.");
      return;
    }

    // Basic URL validation
    if (!/^https?:\/\//i.test(urlToSave)) {
      setSaveError("URL must start with http:// or https://");
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
          url: urlToSave,
          note: note.trim() || undefined,
          saveSource: "extension",
          isArchived,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          collectionId: selectedCollection || undefined,
          ...(category ? { itemType: category } : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSaveMessage("Saved successfully!");
      setNote("");
      setSelectedTags([]);
      setManualUrl("");
      setUseManualUrl(false);
      setCategory("");
      setSelectedCollection("");
      setIsArchived(false);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (requestError: any) {
      const status = requestError?.response?.status;
      const errorMsg = requestError?.response?.data?.error || "Failed to save.";

      if (status === 401) {
        // Check if the error message indicates a permanent issue
        const isRevoked = /revoked|expired|invalid/i.test(errorMsg);
        if (isRevoked) {
          await clearJwtToken();
          setAuthState("disconnected");
          setSaveError("Token expired or revoked. Please reconnect.");
        } else {
          // Transient 401 — retry without clearing token
          setSaveError("Auth error. Please try again.");
        }
      } else {
        setSaveError(errorMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Shared input styles ──
  const inputStyle = {
    padding: "8px 10px",
    borderRadius: "8px",
    border: `1px solid ${COLORS.border}`,
    background: COLORS.inputBg,
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    color: COLORS.text,
    width: "100%",
  } as const;

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2352525b' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    paddingRight: "28px",
  };

  return (
    <div
      style={{
        width: 340,
        padding: "20px",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
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

      {/* ── Disconnected — Token Paste ── */}
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
            <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: COLORS.text }}>
              Connect your account
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: COLORS.mutedText, lineHeight: 1.5 }}>
              Generate an access token from your{" "}
              <a
                href={`${FRONTEND_BASE}/dashboard/settings`}
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
                ...inputStyle,
                fontFamily: "monospace",
                fontSize: "12px",
                resize: "none",
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

      {/* ── Connected — Save UI ── */}
      {authState === "connected" && (
        <main style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* User badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              borderRadius: "8px",
              background: "#ecfdf5",
              border: "1px solid #d1fae5",
            }}
          >
            <span style={{ fontSize: "12px" }}>✓</span>
            <span style={{ fontSize: "11px", color: "#059669", fontWeight: 500 }}>
              Connected as {user?.name || user?.email || "User"}
            </span>
          </div>

          {/* Active tab / URL source toggle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: COLORS.mutedText }}>
                {useManualUrl ? "Custom URL" : "Current Page"}
              </label>
              <button
                onClick={() => setUseManualUrl(!useManualUrl)}
                style={{
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: 600,
                  background: "none",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "100px",
                  color: COLORS.mutedText,
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                {useManualUrl ? "Use current page" : "Enter URL manually"}
              </button>
            </div>

            {useManualUrl ? (
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://example.com/article"
                style={inputStyle}
              />
            ) : (
              <div
                style={{
                  padding: "10px 12px",
                  background: COLORS.secondaryBg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
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
                    marginBottom: "2px",
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
            )}
          </div>

          {/* Category selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: COLORS.mutedText }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={selectStyle}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Collection selector */}
          {collections.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: COLORS.mutedText }}>
                Collection
              </label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                style={selectStyle}
              >
                <option value="">No Collection</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                ...inputStyle,
                resize: "none",
                minHeight: "44px",
              }}
            />
          </div>

          {/* Tags */}
          {tagSuggestions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: COLORS.mutedText }}>
                Tags
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: "3px 10px",
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

          {/* Archive option */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <input
              type="checkbox"
              id="archiveCheckbox"
              checked={isArchived}
              onChange={(e) => setIsArchived(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <label htmlFor="archiveCheckbox" style={{ fontSize: "12px", color: COLORS.mutedText, cursor: "pointer", userSelect: "none" }}>
              Send straight to Archive
            </label>
          </div>

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
                padding: "6px",
                borderRadius: "6px",
                background: "#ecfdf5",
              }}
            >
              ✓ {saveMessage}
            </div>
          )}
          {saveError && (
            <div
              style={{
                fontSize: "12px",
                color: COLORS.error,
                textAlign: "center",
                fontWeight: 500,
                padding: "6px",
                borderRadius: "6px",
                background: "#fef2f2",
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
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: "10px",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "11px", color: COLORS.mutedText }}>
          Manage tokens in your{" "}
          <a
            href={`${FRONTEND_BASE}/dashboard/settings`}
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
