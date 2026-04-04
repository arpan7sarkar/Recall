"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Search, Sparkles, Network, X, Check, Cloud } from "lucide-react";

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  
  return (
    <div className="min-h-screen bg-[#070707] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Abstract Atmosphere Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         {/* Top auroral spread */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] sm:w-[100%] h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-[#070707] to-[#070707] opacity-80" />
         {/* Subtle starry/grid texture */}
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 py-6">
         <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-zinc-200 to-zinc-400 text-[#070707] flex items-center justify-center font-serif font-black text-sm shadow-md">
              R
            </div>
            <span className="font-serif font-medium text-lg tracking-wide text-zinc-100">Recall</span>
         </div>
         <div className="hidden md:flex items-center gap-10 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-zinc-100 transition-colors">Platform</a>
            <a href="#pricing" className="hover:text-zinc-100 transition-colors">Pricing</a>
            <a href="#mission" className="hover:text-zinc-100 transition-colors">Mission</a>
         </div>
         <div className="flex items-center gap-4">
            {isLoaded && !isSignedIn && (
              <div className="flex items-center gap-4">
                <Link href={ROUTES.login} className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">Log in</Link>
                <Link href={ROUTES.register} className="text-sm font-medium text-[#070707] bg-zinc-100 hover:bg-white px-5 py-2.5 rounded-full transition-colors shadow-sm hidden sm:block">Start free</Link>
              </div>
            )}
            {isLoaded && isSignedIn && (
               <Link href={ROUTES.dashboard} className="text-sm font-medium text-[#070707] bg-zinc-100 hover:bg-white px-5 py-2.5 rounded-full transition-colors flex items-center gap-2 shadow-sm">
                  Dashboard <ArrowRight size={14} />
               </Link>
            )}
         </div>
      </nav>

      <main className="relative z-10 w-full flex flex-col items-center">
        
        {/* HERO SECTION */}
        <section className="flex flex-col items-center justify-center pt-28 pb-32 px-6 text-center w-full max-w-5xl">
           <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
              <Sparkles size={12} className="text-indigo-300" />
              <span className="text-[11px] uppercase font-bold tracking-widest text-zinc-300">Introducing Spatial Intelligence</span>
           </div>
           
           <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-serif text-zinc-50 tracking-tight leading-[1.05] mb-8 max-w-4xl mx-auto drop-shadow-lg">
             Your extended mind <br className="hidden sm:block"/>
             for the digital age
           </h1>
           
           <p className="text-lg sm:text-xl text-zinc-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
             Turn overwhelming information into insights. Save anything instantly and let semantic AI connect your knowledge invisibly—without folders or rigid systems.
           </p>

           <div className="flex flex-col sm:flex-row items-center gap-5">
              <Link href={ROUTES.register} className="px-8 py-3.5 rounded-full bg-zinc-100 hover:bg-white text-[#070707] font-medium transition-transform active:scale-95 flex items-center gap-2 shadow-[0_2px_15px_rgba(255,255,255,0.1)]">
                Start your vault <ArrowRight size={16} />
              </Link>
           </div>
        </section>

        {/* FEATURES BENTO GRID */}
        <section id="features" className="w-full max-w-7xl px-6 pb-32">
           <div className="mb-14 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-5 tracking-tight">Deep research for modern work</h2>
              <p className="text-zinc-400 text-lg font-light max-w-2xl mx-auto">Remove the cognitive load of organizing. Focus fully on thinking, exploring, and building connections.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 auto-rows-[340px] md:auto-rows-[380px]">
              
              {/* Box 1: Semantic Search (Wide) */}
              <div className="col-span-1 md:col-span-2 relative rounded-3xl bg-[#0e0e0e] border border-white/[0.04] overflow-hidden flex flex-col justify-end p-10 group hover:border-white/10 transition-colors duration-500 shadow-xl">
                 <div className="absolute inset-0 bg-gradient-to-tl from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
                 
                 {/* Decorative mock UI */}
                 <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[85%] h-56 rounded-xl bg-[#141414] border border-white/5 shadow-2xl flex flex-col p-6 z-0 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-700">
                    <div className="w-full h-10 border border-white/10 rounded-lg flex items-center px-4 gap-3 bg-[#0a0a0a] mb-6">
                       <Search size={14} className="text-zinc-500" />
                       <div className="h-1.5 w-1/3 bg-zinc-700 rounded" />
                    </div>
                    <div className="space-y-4 px-2">
                       <div className="flex items-center gap-4 opacity-50">
                          <Cloud size={16} className="text-zinc-500" />
                          <div className="h-1.5 w-1/2 bg-zinc-600 rounded" />
                       </div>
                       <div className="flex items-center gap-4 opacity-80">
                          <Sparkles size={16} className="text-indigo-400" />
                          <div className="h-1.5 w-3/4 bg-zinc-400 rounded" />
                       </div>
                    </div>
                 </div>

                 <div className="relative z-20">
                    <div className="flex items-center gap-2 mb-3 text-indigo-300">
                       <Search size={16} />
                       <span className="text-sm font-medium tracking-wide">Semantic Intelligence</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-serif text-white mb-3">Search by meaning, not text</h3>
                    <p className="text-zinc-400 text-sm sm:text-base max-w-md font-light leading-relaxed mb-4">Recall bypasses rigid keywords. Ask questions naturally and instantly discover the exact ideas locked inside your vault.</p>
                 </div>
              </div>

              {/* Box 2: Auto Tagging (Square) */}
              <div className="col-span-1 border-white/[0.04] border bg-[#0e0e0e] rounded-3xl overflow-hidden relative p-8 flex flex-col justify-end group hover:border-white/10 transition-colors duration-500 shadow-xl">
                 <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                 
                 {/* Decorative mock UI */}
                 <div className="absolute top-12 left-8 right-8 h-full rounded-2xl bg-[#141414] border border-white/5 p-5 shadow-2xl group-hover:-translate-y-2 transition-transform duration-700 flex flex-col items-center gap-5">
                    <div className="w-14 h-14 rounded-full border border-indigo-500/20 flex items-center justify-center bg-indigo-500/10 shrink-0">
                       <Sparkles size={24} className="text-indigo-300" />
                    </div>
                    <div className="w-full flex justify-center gap-2 flex-wrap">
                       <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full h-6 w-16" />
                       <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full h-6 w-24" />
                       <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full h-6 w-20" />
                    </div>
                 </div>

                 <div className="relative z-20 mt-auto">
                    <h3 className="text-xl sm:text-2xl font-serif text-white mb-2">Automated Curation</h3>
                    <p className="text-zinc-400 text-sm font-light leading-relaxed">AI extracts entities, topics, and structures automatically on ingest.</p>
                 </div>
              </div>

              {/* Box 3: Social Archiving (Square) */}
              <div className="col-span-1 border-white/[0.04] border bg-[#0e0e0e] rounded-3xl overflow-hidden relative p-8 flex flex-col group hover:border-white/10 transition-colors duration-500 shadow-xl">
                 <div className="relative z-20 mb-8">
                    <h3 className="text-xl sm:text-2xl font-serif text-white mb-2 mt-2">Twitter Integration</h3>
                    <p className="text-zinc-400 text-sm font-light leading-relaxed">Instantly archive threads without losing context.</p>
                 </div>
                 
                 {/* Decorative mock UI */}
                 <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-[#121a22] to-[#15202b] border border-white/5 p-5 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-700 mt-auto mx-auto shadow-inner">
                    <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                       <div className="space-y-3 flex-1 mt-1">
                          <div className="h-2 w-28 bg-white/20 rounded" />
                          <div className="h-1.5 w-full bg-white/10 rounded" />
                          <div className="h-1.5 w-5/6 bg-white/10 rounded" />
                          <div className="h-1.5 w-4/6 bg-white/10 rounded" />
                       </div>
                    </div>
                    <X className="absolute bottom-5 right-5 text-sky-400/20" size={48} />
                 </div>
              </div>

              {/* Box 4: Knowledge Graph (Wide) */}
              <div className="col-span-1 md:col-span-2 relative rounded-3xl bg-[#0e0e0e] border border-white/[0.04] overflow-hidden flex flex-col justify-end p-10 group hover:border-white/10 transition-colors duration-500 shadow-xl">
                 <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(ellipse_at_center_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
                 
                 {/* Graph Visualization Mock */}
                 <div className="absolute inset-0 flex items-center justify-end px-16 opacity-30 z-0 pointer-events-none group-hover:opacity-50 transition-opacity duration-1000">
                    <div className="relative w-64 h-64">
                      {/* Abstract graph nodes */}
                      <div className="absolute w-3 h-3 bg-indigo-400 rounded-full top-[20%] left-[30%] shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                      <div className="absolute w-2 h-2 bg-zinc-300 rounded-full top-[50%] left-[80%]" />
                      <div className="absolute w-1.5 h-1.5 bg-zinc-500 rounded-full top-[80%] left-[40%]" />
                      <div className="absolute w-2 h-2 bg-zinc-400 rounded-full top-[35%] left-[65%]" />
                      
                      <svg className="absolute inset-0 w-full h-full text-white/20" xmlns="http://www.w3.org/2000/svg">
                         <line x1="30%" y1="20%" x2="80%" y2="50%" stroke="currentColor" strokeWidth="1" />
                         <line x1="30%" y1="20%" x2="40%" y2="80%" stroke="currentColor" strokeWidth="1" />
                         <line x1="65%" y1="35%" x2="80%" y2="50%" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </div>
                 </div>

                 <div className="relative z-20 max-w-sm">
                    <div className="flex items-center gap-2 mb-3 text-zinc-300">
                       <Network size={16} />
                       <span className="text-sm font-medium tracking-wide">Knowledge Graph</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-serif text-white mb-3">Visualize your mind</h3>
                    <p className="text-zinc-400 text-sm sm:text-base font-light leading-relaxed">Trace the topology of your thoughts. Reveal unseen connections between references collected months apart, entirely mapped by AI.</p>
                 </div>
              </div>

           </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="w-full max-w-7xl px-6 py-24 flex flex-col items-center">
           <div className="mb-14 text-center">
             <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white text-center mb-4">Simple scalable pricing</h2>
             <p className="text-zinc-400 text-lg font-light">One plan for individuals, one for infinite scaling.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              
              {/* Free Scale */}
              <div className="rounded-3xl bg-[#0a0a0a] border border-white/[0.04] p-10 flex flex-col shadow-lg">
                 <h3 className="text-lg font-medium text-zinc-300 mb-2">Hobby</h3>
                 <div className="flex items-end gap-2 mb-8">
                    <span className="text-5xl font-serif text-white leading-none">$0</span>
                    <span className="text-zinc-500 font-medium mb-1">/ forever</span>
                 </div>
                 
                 <div className="space-y-4 mb-10 flex-1">
                    <div className="flex items-start gap-3">
                       <Check size={16} className="text-indigo-400 mt-1 shrink-0" />
                       <span className="text-zinc-300 font-light">Up to 1,000 vault items</span>
                    </div>
                    <div className="flex items-start gap-3">
                       <Check size={16} className="text-indigo-400 mt-1 shrink-0" />
                       <span className="text-zinc-300 font-light">Standard Semantic Search</span>
                    </div>
                    <div className="flex items-start gap-3">
                       <Check size={16} className="text-indigo-400 mt-1 shrink-0" />
                       <span className="text-zinc-300 font-light">Unlimited Tagging</span>
                    </div>
                 </div>

                 <Link href={ROUTES.register} className="w-full py-3.5 rounded-full border border-white/10 text-center font-medium text-zinc-300 hover:bg-white/5 transition-colors">Create Free Account</Link>
              </div>

              {/* Pro Scale */}
              <div className="rounded-3xl bg-[#0e0e0e] border border-indigo-500/20 p-10 flex flex-col relative overflow-hidden shadow-2xl">
                 <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                 
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-white">Pro</h3>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-widest uppercase">Unlimited</span>
                 </div>
                 <div className="flex items-end gap-2 mb-8">
                    <span className="text-5xl font-serif text-white leading-none">$8</span>
                    <span className="text-zinc-500 font-medium mb-1">/ month</span>
                 </div>
                 
                 <div className="space-y-4 mb-10 flex-1 relative z-10">
                    <div className="flex items-start gap-3">
                       <Check size={16} className="text-white mt-1 shrink-0" />
                       <span className="text-zinc-200 font-light">Unlimited vault items</span>
                    </div>
                    <div className="flex items-start gap-3">
                       <Check size={16} className="text-white mt-1 shrink-0" />
                       <span className="text-zinc-200 font-light">Deep AI natural language models</span>
                    </div>
                    <div className="flex items-start gap-3">
                       <Check size={16} className="text-white mt-1 shrink-0" />
                       <span className="text-zinc-200 font-light">Interactive Knowledge Graph Access</span>
                    </div>
                    <div className="flex items-start gap-3">
                       <Check size={16} className="text-white mt-1 shrink-0" />
                       <span className="text-zinc-200 font-light">Premium Support Pipeline</span>
                    </div>
                 </div>

                 <Link href={ROUTES.register} className="relative z-10 w-full py-3.5 rounded-full bg-white text-[#050505] text-center font-medium hover:bg-zinc-200 transition-all shadow-[0_2px_15px_rgba(255,255,255,0.1)] active:scale-95">Upgrade to Pro</Link>
              </div>
           </div>
        </section>

        {/* BOTTOM CTA (Oval cutout) */}
        <section className="w-full flex flex-col items-center justify-center pt-32 pb-8 relative overflow-hidden min-h-[500px]">
           {/* Dark misty glow backdrop mapping to the bottom edge */}
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] max-w-[1200px] h-[400px] pointer-events-none">
              <div className="absolute bottom-[-100px] w-full h-[300px] bg-gradient-to-t from-indigo-500/10 to-transparent blur-[80px] rounded-[100%]" />
           </div>

           <div className="relative z-10 text-center max-w-2xl px-6 mb-20 flex flex-col items-center">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white tracking-tight leading-[1.1] mb-6">Elevate your second brain.</h2>
              <p className="text-zinc-400 mb-10 font-light text-lg">Join the vanguard of thinkers building spatial intelligence networks.</p>
              <Link href={ROUTES.register} className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#070707] font-medium hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Start your vault
              </Link>
           </div>
           
           {/* Massive watermark logo */}
           <div className="w-full overflow-hidden flex justify-center opacity-[0.02] select-none pointer-events-none mt-auto">
              <h1 className="text-[25vw] sm:text-[20vw] leading-[0.7] font-serif tracking-tighter">Recall</h1>
           </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.04] py-12 px-6 lg:px-12 w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center font-serif font-black text-xs">R</div>
            <span className="font-serif text-sm text-zinc-500">Recall Inc. © 2026</span>
         </div>
         <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-zinc-500 font-light">
            <Link href="#" className="hover:text-zinc-300 transition-colors">Platform</Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
         </div>
      </footer>
    </div>
  );
}
