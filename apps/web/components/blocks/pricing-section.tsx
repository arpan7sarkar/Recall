"use client";
import React, { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

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
    <section id="pricing" className="relative py-32 bg-transparent">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0059ff08] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-md mb-6">
            <Sparkles size={12} className="text-[#0059ff]" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Investment in yourself</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-serif text-white mb-6 italic tracking-tight">
            One workspace. <br />
            <span className="text-[#0059ff]">Infinite leverage.</span>
          </h2>
          <p className="text-lg text-zinc-400 mb-10 font-light leading-relaxed">
            The sharpest thinkers invest in their thinking environment first.
            Start free, scale when you're ready.
          </p>

          <div className="inline-flex items-center bg-white/5 border border-white/10 backdrop-blur-sm rounded-full p-1 shadow-inner">
            <button
              className={`px-8 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${!isAnnual
                  ? 'bg-[#0059ff] text-white shadow-lg shadow-[#0059ff22]'
                  : 'text-zinc-400 hover:text-white'
                }`}
              onClick={() => setIsAnnual(false)}
            >
              MONTHLY
            </button>
            <button
              className={`px-8 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${isAnnual
                  ? 'bg-[#0059ff] text-white shadow-lg shadow-[#0059ff22]'
                  : 'text-zinc-400 hover:text-white'
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
              className={`relative flex flex-col rounded-[2rem] border animate-in fade-in slide-in-from-bottom-4 duration-700 delay-${index * 100} ${plan.highlighted
                  ? 'border-[#0059ff88] bg-[#0e0e0e] shadow-[0_0_50px_rgba(0,89,255,0.05)] scale-105 z-20'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors z-10'
                } p-8 lg:p-10`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                   <div className="px-4 py-1 bg-[#0059ff] text-[10px] font-bold text-white rounded-full tracking-[0.15em] uppercase shadow-lg shadow-[#0059ff22]">
                     Recommended
                   </div>
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-2xl font-serif italic text-white mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white tracking-tighter">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-zinc-500 text-sm font-light">
                      /{isAnnual ? 'yr' : 'mo'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 mt-6 font-light">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                       <Check className="h-2.5 w-2.5 text-[#0059ff]" />
                    </div>
                    <span className="text-sm text-zinc-400 font-light leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                className={`w-full py-7 rounded-2xl text-sm font-bold tracking-tight transition-all active:scale-95 ${plan.highlighted
                    ? 'bg-white text-black hover:bg-zinc-200'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
              >
                 <Link href={isSignedIn ? ROUTES.dashboard : ROUTES.register}>
                    {plan.cta}
                 </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

