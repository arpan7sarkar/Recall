import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 lg:px-12 border-b"
        style={{ height: 64, background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg font-bold text-white"
            style={{ width: 32, height: 32, background: "var(--accent-500)", fontSize: 16 }}
          >
            R
          </div>
          <span className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
            Recall
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.login}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors focus-ring"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign In
          </Link>
          <Link
            href={ROUTES.register}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus-ring"
            style={{ background: "var(--accent-500)", borderRadius: "var(--radius-md)" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-20 lg:py-32">
        <div className="max-w-3xl text-center">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{ background: "var(--accent-50)", color: "var(--accent-600)" }}
          >
            Your personal knowledge base
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            Never forget
            <br />
            what you{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent-500), var(--warm-500))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              discovered
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Save articles, tweets, videos, and PDFs from anywhere on the internet. AI
            organises, connects, and resurfaces your knowledge at the right time.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href={ROUTES.register}
              className="px-8 py-3 text-base font-semibold text-white rounded-xl transition-all focus-ring"
              style={{ background: "var(--accent-500)", borderRadius: "var(--radius-lg)" }}
            >
              Start for Free
            </Link>
            <Link
              href={ROUTES.login}
              className="px-8 py-3 text-base font-semibold rounded-xl transition-all focus-ring"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "🔖", title: "Save Anything", desc: "One-click save from the browser extension or paste any URL directly." },
            { icon: "🤖", title: "AI-Powered Tags", desc: "Automatic organisation with intelligent tagging and topic clustering." },
            { icon: "🔍", title: "Semantic Search", desc: "Find ideas by meaning, not just keywords. Search your entire knowledge base." },
            { icon: "🕸️", title: "Knowledge Graph", desc: "Visualise connections between your saved items in an interactive graph." },
            { icon: "💡", title: "Memory Resurfacing", desc: "Rediscover forgotten gems with smart reminders at the right time." },
            { icon: "📁", title: "Collections", desc: "Organise items into themed collections and share them publicly." },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl"
              style={{
                background: "var(--bg-secondary)",
                boxShadow: "var(--shadow-card)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-6 text-center text-xs border-t"
        style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}
      >
        © 2026 Recall. Built with ♥ as a personal knowledge tool.
      </footer>
    </div>
  );
}
