import { FormEvent, useMemo, useState } from "react";
import axios from "axios";
import { setJwtToken } from "~lib/storage";

const API_BASE = process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:4000/v1";

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const loginEndpoint = useMemo(() => `${API_BASE}/auth/extension/login`, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSuccess(false);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(loginEndpoint, {
        email: email.trim(),
        password: password.trim(),
      });

      const token = response?.data?.token;
      if (!token || typeof token !== "string") {
        setError("Login succeeded but no token was returned.");
        return;
      }

      await setJwtToken(token);
      setIsSuccess(true);
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.error ||
        requestError?.message ||
        "Unable to login right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 420,
        margin: "40px auto",
        padding: 24,
        border: "1px solid #d1d5db",
        borderRadius: 12,
        fontFamily: "Segoe UI, sans-serif",
      }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Login to Recall</h1>
      <p style={{ margin: "0 0 20px", color: "#4b5563" }}>
        Sign in to save pages directly from your browser.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: "#0ea5e9",
            color: "#ffffff",
            fontWeight: 600,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      {error ? <p style={{ marginTop: 12, color: "#b91c1c" }}>{error}</p> : null}
      {isSuccess ? (
        <p style={{ marginTop: 12, color: "#047857" }}>
          Logged in successfully. You can return to the extension popup.
        </p>
      ) : null}
    </main>
  );
}

export default AuthPage;
