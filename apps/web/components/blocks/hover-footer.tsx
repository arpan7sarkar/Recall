"use client";
import React from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  X,
  Instagram,
  Github,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";
import { ROUTES } from "@/lib/constants";

export function HoverFooter() {
  const footerLinks = [
    {
      title: "Navigation",
      links: [
        { label: "Dashboard", href: ROUTES.dashboard },
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Initialization", href: ROUTES.register },
      ],
    },
    {
      title: "Protocol",
      links: [
        { label: "Terms of Service", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Security Audit", href: "#" },
        { label: "System Status", href: "#", pulse: true },
      ],
    },
  ];

  const contactInfo = [
    {
      icon: <Mail size={16} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />,
      text: "hello@recall.com",
      href: "mailto:hello@recall.com",
    },
    {
      text: "New York, Terminal 4",
      icon: <MapPin size={16} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />,
    },
  ];

  const socialLinks = [
    { icon: <X size={18} />, label: "X", href: "#" },
    { icon: <Instagram size={18} />, label: "Instagram", href: "#" },
    { icon: <Github size={18} />, label: "Github", href: "#" },
    { icon: <Globe size={18} />, label: "Web", href: "#" },
  ];

  return (
    <footer className="relative w-full overflow-hidden bg-[#070707] pt-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24 mb-20">
          
          {/* Brand section */}
          <div className="flex flex-col space-y-6">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-8 h-8 rounded bg-zinc-800 text-zinc-200 flex items-center justify-center font-serif font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">R</div>
              <span className="text-white text-2xl font-serif font-black">Recall</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed font-light max-w-xs">
              Architecting spatial intelligence for modern minds. Your second brain, refined by obsidian aesthetics.
            </p>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white text-sm font-serif font-bold uppercase tracking-[0.2em] mb-8">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label} className="group flex items-center gap-1">
                    <Link
                      href={link.href}
                      className="text-zinc-500 hover:text-white text-sm font-light transition-all duration-300 flex items-center gap-2"
                    >
                      {link.label}
                      <ArrowUpRight size={12} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </Link>
                    {link.pulse && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse ml-1" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact section */}
          <div>
            <h4 className="text-white text-sm font-serif font-bold uppercase tracking-[0.2em] mb-8">
              Intelligence
            </h4>
            <ul className="space-y-6">
              {contactInfo.map((item, i) => (
                <li key={i} className="group flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-indigo-500/20 group-hover:bg-indigo-500/5 transition-all">
                    {item.icon}
                  </div>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-zinc-500 hover:text-white text-sm font-light transition-colors"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-zinc-500 text-sm font-light">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent mb-12" />

        {/* Interactive Text Hover Effect - Giant "RECALL" moved above credits */}
        <div className="hidden lg:flex h-[20rem] -mt-12 -mb-12 relative opacity-40 hover:opacity-100 transition-opacity duration-1000">
          <TextHoverEffect text="RECALL" className="z-20" />
        </div>

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs space-y-6 md:space-y-0 text-zinc-500 py-12 relative z-30 bg-[#070707]">
          {/* Copyright */}
          <p className="font-light tracking-wide">
            &copy; {new Date().getFullYear()} RECALL INC. ALL RIGHTS RESERVED.
          </p>

          {/* Social icons */}
          <div className="flex space-x-8">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="hover:text-white transition-colors duration-500 opacity-60 hover:opacity-100"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
