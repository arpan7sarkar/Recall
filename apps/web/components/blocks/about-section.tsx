"use client";
import React from "react";
import { Brain, Zap, Globe, Sparkles } from "lucide-react";

export const AboutSection = () => {
  return (
    <section id="about" className="relative py-32 bg-transparent overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left Side: Philosophy Heading */}
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-md mb-8">
              <Brain size={12} className="text-[#0059ff]" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Why Recall</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-serif text-white mb-8 italic leading-[1.1] tracking-tight">
              Built for minds <br />
              <span className="text-[#0059ff]">that never stop.</span>
            </h2>
            
            <p className="text-xl text-zinc-400 font-light leading-relaxed mb-10 max-w-xl">
              The best thinkers don't just consume information — they architect it. 
              Recall is the private workspace where your knowledge compounds, your ideas connect, 
              and nothing valuable is ever lost again.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
               <div className="group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:border-[#0059ff55] transition-colors">
                     <Zap size={18} className="text-[#0059ff]" />
                  </div>
                  <h4 className="text-white font-medium mb-2">Effortless Capture</h4>
                  <p className="text-sm text-zinc-500 font-light leading-snug">Save web pages, tweets, videos, and files in one keystroke. Your focus stays unbroken.</p>
               </div>
               <div className="group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:border-[#0059ff55] transition-colors">
                     <Globe size={18} className="text-[#0059ff]" />
                  </div>
                  <h4 className="text-white font-medium mb-2">Intelligent Recall</h4>
                  <p className="text-sm text-zinc-500 font-light leading-snug">AI surfaces the exact insight you need, exactly when you need it. No more drowning in search.</p>
               </div>
            </div>
          </div>

          {/* Right Side: Abstract Visual Element */}
          <div className="w-full lg:w-1/2 relative group">
             <div className="aspect-square relative flex items-center justify-center">
                {/* Decorative Rings */}
                <div className="absolute inset-0 border border-[#0059ff11] rounded-full scale-100 group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-10 border border-[#0059ff08] rounded-full scale-100 group-hover:scale-110 transition-transform duration-1000 delay-100" />
                <div className="absolute inset-20 border border-[#0059ff05] rounded-full scale-100 group-hover:scale-125 transition-transform duration-1000 delay-200" />
                
                {/* Centered Icon with Glow */}
                <div className="relative z-10 w-32 h-32 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-[0_0_80px_rgba(0,89,255,0.15)] group-hover:shadow-[0_0_120px_rgba(0,89,255,0.25)] transition-all">
                   <div className="absolute inset-0 rounded-full bg-linear-to-tr from-transparent via-[#0059ff11] to-transparent opacity-50 px-px py-px" />
                   <Sparkles size={40} className="text-white opacity-80" />
                </div>

                {/* Floating Labels */}
                <div className="absolute top-[20%] right-[10%] px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full animate-float translate-x-2">
                   <span className="text-[10px] text-zinc-400 tracking-widest font-bold">AI-POWERED</span>
                </div>
                <div className="absolute bottom-[30%] left-[10%] px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full animate-float delay-700 -translate-x-2">
                   <span className="text-[10px] text-zinc-400 tracking-widest font-bold">ALWAYS LEARNING</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
