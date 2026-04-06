"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";

interface ExtensionToken {
  id: string;
  label: string;
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: "active" | "expired" | "revoked";
}

interface NewTokenResponse {
  id: string;
  token: string;
  label: string;
  expiresAt: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [tokens, setTokens] = useState<ExtensionToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [label, setLabel] = useState("");
  const [expiryDays, setExpiryDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) return;

      const data = await api.get<ExtensionToken[]>("/auth/extension-tokens", { token });
      setTokens(data);
    } catch {
      setError("Failed to load tokens");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      const data = await api.post<NewTokenResponse>("/auth/extension-tokens", {
        label: label.trim() || "My Extension",
        expiresInDays: expiryDays,
      }, { token });

      setNewToken(data.token);
      setLabel("");
      await fetchTokens();
    } catch (err: any) {
      setError(err?.body?.error || "Failed to create token");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Missing auth token");
      await api.delete(`/auth/extension-tokens/${id}`, { token });
      await fetchTokens();
    } catch {
      setError("Failed to revoke token");
    }
  };

  const handleCopy = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const activeTokens = tokens.filter((t) => t.status === "active");
  const inactiveTokens = tokens.filter((t) => t.status !== "active");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 700,
          marginBottom: "8px",
          color: "var(--text-primary)",
          letterSpacing: "-0.5px",
        }}
      >
        Settings
      </h1>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px" }}>
        Manage your extension access tokens and account preferences.
      </p>

      {/* ── Generate Token Section ──────────────────────── */}
      <section
        style={{
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            marginBottom: "4px",
            color: "var(--text-primary)",
          }}
        >
          Browser Extension
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Generate a temporary access token to connect your browser extension. Paste it in the
          extension popup to start saving pages.
        </p>

        {/* New Token Display (shown only once) */}
        {newToken && (
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-hover)",
              background: "var(--bg-tertiary)",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#059669" }}>
                ✓ Token created
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                }}
              >
                Copy it now — it won't be shown again
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <code
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  color: "var(--text-primary)",
                  wordBreak: "break-all",
                  userSelect: "all",
                }}
              >
                {newToken}
              </code>
              <button
                onClick={handleCopy}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: copied ? "#059669" : "var(--button-primary-bg)",
                  color: copied ? "#fff" : "var(--button-primary-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Create Form */}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Work Chrome"
              maxLength={64}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-tertiary)",
                fontSize: "14px",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ minWidth: "140px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Expires in
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-tertiary)",
                fontSize: "14px",
                color: "var(--text-primary)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "var(--button-primary-bg)",
              color: "var(--button-primary-text)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isCreating ? "not-allowed" : "pointer",
              opacity: isCreating ? 0.7 : 1,
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {isCreating ? "Generating..." : "Generate Token"}
          </button>
        </div>

        {error && (
          <p style={{ marginTop: "12px", fontSize: "13px", color: "#dc2626" }}>{error}</p>
        )}
      </section>

      {/* ── Active Tokens ──────────────────────────────── */}
      <section
        style={{
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            marginBottom: "16px",
            color: "var(--text-primary)",
          }}
        >
          Active Tokens
        </h2>

        {isLoading ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>
            Loading tokens...
          </div>
        ) : activeTokens.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "13px",
              borderRadius: "12px",
              background: "var(--bg-tertiary)",
            }}
          >
            No active tokens. Generate one above to connect your extension.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeTokens.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {t.label}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "100px",
                        background: "#ecfdf5",
                        color: "#059669",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Active
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "flex", gap: "16px" }}>
                    <span>Expires {formatDate(t.expiresAt)}</span>
                    {t.lastUsedAt && <span>Last used {formatDate(t.lastUsedAt)}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(t.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "transparent",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#dc2626",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Inactive Tokens History ─────────────────────── */}
      {inactiveTokens.length > 0 && (
        <section
          style={{
            padding: "24px",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
          }}
        >
          <h2
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "12px",
              color: "var(--text-tertiary)",
            }}
          >
            Token History
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {inactiveTokens.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "var(--bg-tertiary)",
                  opacity: 0.7,
                }}
              >
                <div>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{t.label}</span>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "100px",
                    background: t.status === "revoked" ? "#fef2f2" : "#fef9c3",
                    color: t.status === "revoked" ? "#dc2626" : "#a16207",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
