"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Mock login — replace with real API call
      await new Promise((r) => setTimeout(r, 600));
      setAuth(
        {
          id: "u1",
          email,
          name: email.split("@")[0],
          avatarUrl: null,
          googleId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        "mock-jwt-token-" + Date.now()
      );
      router.push(ROUTES.dashboard);
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-8 rounded-2xl space-y-6"
      style={{
        background: "var(--bg-secondary)",
        boxShadow: "var(--shadow-lg)",
        borderRadius: "var(--radius-xl)",
      }}
    >
      {/* Logo */}
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center rounded-xl font-bold text-white text-xl mb-4"
          style={{ width: 48, height: 48, background: "var(--accent-500)" }}
        >
          R
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Welcome back
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Sign in to your Recall account
        </p>
      </div>

      {/* Google OAuth */}
      <button
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors focus-ring"
        style={{
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          borderRadius: "var(--radius-md)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* Email/Password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-md)",
            }}
            id="login-email"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-md)",
            }}
            id="login-password"
          />
        </div>

        {error && (
          <p className="text-xs font-medium" style={{ color: "var(--error)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all focus-ring disabled:opacity-60"
          style={{ background: "var(--accent-500)", borderRadius: "var(--radius-md)" }}
          id="login-submit"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        Don&apos;t have an account?{" "}
        <Link
          href={ROUTES.register}
          className="font-medium underline"
          style={{ color: "var(--accent-500)" }}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
