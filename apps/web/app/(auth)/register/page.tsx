"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setAuth(
        {
          id: "u1",
          email,
          name,
          avatarUrl: null,
          googleId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        "mock-jwt-token-" + Date.now()
      );
      router.push(ROUTES.dashboard);
    } catch {
      setError("Registration failed. Please try again.");
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
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center rounded-xl font-bold text-white text-xl mb-4"
          style={{ width: 48, height: 48, background: "var(--accent-500)" }}
        >
          R
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Create your account
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Start building your personal knowledge base
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "var(--radius-md)" }}
            id="register-name"
          />
        </div>
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
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "var(--radius-md)" }}
            id="register-email"
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
            placeholder="Min 8 characters"
            required
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none focus-ring"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "var(--radius-md)" }}
            id="register-password"
          />
        </div>

        {error && <p className="text-xs font-medium" style={{ color: "var(--error)" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all focus-ring disabled:opacity-60"
          style={{ background: "var(--accent-500)", borderRadius: "var(--radius-md)" }}
          id="register-submit"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-medium underline" style={{ color: "var(--accent-500)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
