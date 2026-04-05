"use client";
import React, { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const { isSignedIn } = useAuth();

  const plans = [
    {
      name: "Free",
      price: "₹0",
      description: "Begin your knowledge practice",
      features: [
        "Up to 100 saved items",
        "AI-powered auto-tagging",
        "Basic knowledge graph",
        "Community support"
      ],
      cta: "Start Free",
      highlighted: false
    },
    {
      name: "Pro",
      price: isAnnual ? "₹1099" : "₹99",
      description: "For serious knowledge builders",
      features: [
        "Unlimited saved items",
        "Priority AI tagging & summarization",
        "Deep semantic search",
        "Full knowledge graph & insights",
        "R2 file storage & fast sync",
        "Priority support"
      ],
      cta: "Upgrade to Pro",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams that think together",
      features: [
        "Everything in Pro",
        "Shared knowledge workspaces",
        "Dedicated storage & infrastructure",
        "Admin controls & audit logs",
        "Custom AI model integrations",
        "Dedicated account manager"
      ],
      cta: "Talk to us",
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="relative py-32 bg-transparent overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-md mb-6">
            <Sparkles size={12} className="text-accent" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500">The Thinker's Investment</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-serif text-white mb-8 italic tracking-tight leading-[1.1]">
            One workspace. <br />
            <span className="text-accent">Infinite leverage.</span>
          </h2>
          <p className="text-xl text-zinc-400 mb-12 font-light leading-relaxed max-w-2xl mx-auto">
            The sharpest minds prioritize their knowledge infrastructure.
            Scale your second brain as your ambition grows.
          </p>

          <div className="inline-flex items-center bg-white/5 border border-white/10 backdrop-blur-sm rounded-full p-1.5 shadow-inner">
            <button
              className={`px-10 py-2.5 rounded-full text-[10px] font-bold tracking-widest transition-all duration-500 ${!isAnnual
                  ? 'bg-accent text-background shadow-xl shadow-accent/20'
                  : 'text-zinc-500 hover:text-white'
                }`}
              onClick={() => setIsAnnual(false)}
            >
              MONTHLY
            </button>
            <button
              className={`px-10 py-2.5 rounded-full text-[10px] font-bold tracking-widest transition-all duration-500 ${isAnnual
                  ? 'bg-accent text-background shadow-xl shadow-accent/20'
                  : 'text-zinc-500 hover:text-white'
                }`}
              onClick={() => setIsAnnual(true)}
            >
              ANNUAL
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-4xl border transition-all duration-700 animate-in fade-in slide-in-from-bottom-8",
                plan.highlighted
                  ? "border-accent/40 bg-zinc-950/80 backdrop-blur-xl shadow-2xl shadow-accent/5 scale-105 z-20"
                  : "border-white/5 bg-white/2 hover:bg-white/4 z-10"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                   <div className="px-5 py-1.5 bg-accent text-[9px] font-black text-background rounded-full tracking-[0.2em] uppercase shadow-2xl shadow-accent/30">
                     SYSTEM RECOGNIZED
                   </div>
                </div>
              )}

              <div className="p-8 lg:p-10 flex flex-col h-full bg-linear-to-b from-white/2 to-transparent">
                <div className="mb-10">
                  <h3 className="text-2xl font-serif italic text-white mb-4 lowercase tracking-tight opacity-70">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold text-white tracking-tighter">{plan.price}</span>
                    {plan.price !== "Custom" && (
                      <span className="text-zinc-600 text-sm font-light">
                        /{isAnnual ? 'yr' : 'mo'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 mt-6 font-light leading-relaxed">{plan.description}</p>
                </div>

                <div className="space-y-5 mb-12 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-4 group/item">
                      <div className="shrink-0 w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center transition-colors group-hover/item:border-accent/40">
                         <Check className="h-3 w-3 text-accent" />
                      </div>
                      <span className="text-sm text-zinc-400 font-light tracking-wide">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className={cn(
                    "w-full py-8 rounded-2xl text-xs font-black tracking-[0.15em] uppercase transition-all duration-500 active:scale-95",
                    plan.highlighted
                      ? "bg-white text-black hover:bg-zinc-200 shadow-xl shadow-white/5"
                      : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                  )}
                >
                   <Link href={isSignedIn ? ROUTES.dashboard : ROUTES.register}>
                      {plan.cta}
                   </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

