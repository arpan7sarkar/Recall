"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@clerk/nextjs";
import { 
  Bookmark, 
  Sparkles, 
  Search, 
  Network, 
  Lightbulb, 
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";

const FEATURES = [
  { icon: Bookmark, title: "Save Anything", desc: "One-click save from our extension or paste any URL directly into your vaults." },
  { icon: Sparkles, title: "AI-Powered Tags", desc: "Automatic organisation with intelligent tagging and deep topic clustering." },
  { icon: Search, title: "Semantic Search", desc: "Find ideas by meaning, not just keywords. Search your entire knowledge base instantly." },
  { icon: Network, title: "Knowledge Graph", desc: "Visualise connections between your saved items in an interactive, spatial graph." },
  { icon: Lightbulb, title: "Memory Resurfacing", desc: "Rediscover forgotten gems with smart, contextual reminders precisely when you need them." },
  { icon: Layers, title: "Collections", desc: "Organise items into themed collections and share them with your team or the world." },
];

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col selection:bg-cyan-100 selection:text-cyan-900" style={{ background: "var(--bg-primary)" }}>
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-400/10 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 backdrop-blur-xl border-b bg-white/70 dark:bg-black/70"
        style={{ height: 72, borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 group cursor-pointer">
          <div
            className="flex items-center justify-center rounded-lg font-black text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-transform group-hover:scale-110"
            style={{ width: 36, height: 36, background: "linear-gradient(135deg, var(--accent-500), var(--accent-600))", fontSize: 18 }}
          >
            R
          </div>
          <span className="font-bold text-xl tracking-tighter uppercase" style={{ color: "var(--text-primary)" }}>
            Recall
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-8 mr-8">
            <a href="#features" className="text-xs font-bold uppercase tracking-widest transition-colors hover:text-cyan-500" style={{ color: "var(--text-secondary)" }}>Features</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest transition-colors hover:text-cyan-500" style={{ color: "var(--text-secondary)" }}>Company</a>
          </div>
          
          {isLoaded && !isSignedIn && (
            <div className="flex items-center gap-3">
              <Link
                href={ROUTES.login}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-80"
                style={{ color: "var(--text-primary)" }}
              >
                Sign In
              </Link>
              <Link
                href={ROUTES.register}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white rounded-md shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105 active:scale-95"
                style={{ background: "var(--accent-500)" }}
              >
                Get Started
              </Link>
            </div>
          )}
          {isLoaded && isSignedIn && (
            <Link
              href={ROUTES.dashboard}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white rounded-md shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105 active:scale-95"
              style={{ background: "var(--accent-500)" }}
            >
              Dashboard
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16 lg:pt-36 lg:pb-24 text-center">
        <div className="max-w-5xl z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 border backdrop-blur-sm shadow-sm"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "var(--border)", color: "var(--accent-500)" }}
          >
            <Zap size={12} className="fill-current" />
            <span>Redefining Memory Architecture</span>
          </div>

          <h1
            className="text-6xl sm:text-7xl lg:text-9xl font-black leading-[0.9] mb-10 tracking-tighter uppercase italic"
            style={{ color: "var(--text-primary)" }}
          >
            Digital <br />
            <span
              className="px-2"
              style={{
                background: "linear-gradient(to right, var(--accent-500), #94a3b8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Omniscience
            </span>
          </h1>

          <p
            className="text-lg sm:text-2xl max-w-2xl mx-auto mb-14 leading-relaxed font-bold opacity-60 uppercase tracking-tight"
            style={{ color: "var(--text-secondary)" }}
          >
            The spatial knowledge operating system for high-output thinkers. 
            Capture everything. Recall instantly. Connect deeply.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href={ROUTES.register}
              className="w-full sm:w-auto px-12 py-5 text-sm font-black uppercase tracking-widest text-white rounded-sm shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95"
              style={{ background: "var(--accent-500)" }}
            >
              Initialize Node
            </Link>
            <button
              className="w-full sm:w-auto px-12 py-5 text-sm font-black uppercase tracking-widest rounded-sm border transition-all hover:bg-white/5 active:scale-95"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              View Protocol
            </button>
          </div>
          
          <div className="mt-24 flex items-center justify-center gap-12 opacity-20 grayscale transition-all hover:opacity-50">
            <ShieldCheck size={28} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Encrypted Intelligence</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 lg:px-12 py-32 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter mb-4" style={{ color: "var(--text-primary)" }}>Precision Tooling.</h2>
              <p className="text-xl font-bold uppercase tracking-tight opacity-50" style={{ color: "var(--text-secondary)" }}>Engineered to remove cognitive friction.</p>
            </div>
            <div className="text-xs font-black tracking-[0.5em] uppercase opacity-30">Status: Operational</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 bg-zinc-200 dark:bg-zinc-800 border overflow-hidden rounded-xl" style={{ borderColor: "var(--border)" }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative p-10 transition-all duration-500 hover:bg-white dark:hover:bg-zinc-900"
                style={{
                  background: "var(--bg-secondary)",
                }}
              >
                <div 
                  className="w-12 h-12 rounded-lg mb-8 flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  style={{ background: "var(--bg-tertiary)" }}
                >
                  <f.icon size={24} className="text-cyan-500" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-4" style={{ color: "var(--text-primary)" }}>
                  {f.title}
                </h3>
                <p className="text-sm font-bold leading-relaxed opacity-40 group-hover:opacity-60 transition-opacity" style={{ color: "var(--text-secondary)" }}>
                  {f.desc}
                </p>
                <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                   <ArrowRight size={16} className="text-cyan-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 lg:px-12 py-32">
        <div 
          className="max-w-7xl mx-auto border-y py-24 text-center relative overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-5xl lg:text-8xl font-black tracking-tighter uppercase mb-10" style={{ color: "var(--text-primary)" }}>Scale your mind.</h2>
            <Link
              href={ROUTES.register}
              className="inline-block px-14 py-6 text-sm font-black uppercase tracking-widest bg-white dark:bg-white text-black rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-16 lg:px-12"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-cyan-500 text-white flex items-center justify-center font-black">R</div>
                <span className="font-bold text-xl uppercase tracking-tighter">Recall.</span>
             </div>
             <p className="text-xs font-bold uppercase tracking-widest opacity-40 max-w-[200px]">The architect's tool for knowledge connection.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="flex flex-col gap-4 text-xs">
              <span className="font-black uppercase tracking-widest opacity-20">Network</span>
              <Link href="#" className="font-bold uppercase tracking-widest hover:text-cyan-500">Twitter</Link>
              <Link href="#" className="font-bold uppercase tracking-widest hover:text-cyan-500">GitHub</Link>
            </div>
            <div className="flex flex-col gap-4 text-xs">
              <span className="font-black uppercase tracking-widest opacity-20">Legal</span>
              <Link href="#" className="font-bold uppercase tracking-widest hover:text-cyan-500">Privacy</Link>
              <Link href="#" className="font-bold uppercase tracking-widest hover:text-cyan-500">Terms</Link>
            </div>
            <div className="flex flex-col gap-4 text-xs">
              <span className="font-black uppercase tracking-widest opacity-20">Support</span>
              <Link href="#" className="font-bold uppercase tracking-widest hover:text-cyan-500">Contact</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t flex justify-between items-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20">
            Memory Protocol v2.4.0
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20">
            Recall Inc. © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
