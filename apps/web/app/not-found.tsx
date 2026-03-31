import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <div className="text-center">
        <span className="text-6xl mb-4 block opacity-30">🔍</span>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Page not found
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-white focus-ring"
          style={{ background: "var(--accent-500)", borderRadius: "var(--radius-md)" }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
