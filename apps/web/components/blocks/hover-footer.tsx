"use client";
import React from "react";
import Link from "next/link";
import {
  Mail,
  Linkedin,
  MapPin,
  X,
  Instagram,
  Github,
  PenLine,
  Code2,
  ArrowUpRight,
} from "lucide-react";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";
import { ROUTES } from "@/lib/constants";

export const socialLinks = [
  {name:"Portfolio", href:"https://arpansarkar.vercel.app", icon:"globe"},
  { name: "GitHub", href: "https://github.com/arpan7sarkar", icon: "github" },
  { name: "LinkedIn", href: "https://linkedin.com/in/arpan7sarkar", icon: "linkedin" },
  { name: "Twitter / X", href: "https://twitter.com/arpan7sarkar", icon: "twitter" },
  { name: "Instagram", href: "https://instagram.com/arpan7sarkar", icon: "instagram" },
  { name: "Email", href: "mailto:contact.arpan.sarkar@gmail.com", icon: "mail" },
];

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
      text: "contact.arpan.sarkar@gmail.com",
      href: "mailto:contact.arpan.sarkar@gmail.com",
    },
    {
      text: "Kolkata, India",
      icon: <MapPin size={16} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />,
    },
  ];

  const socialIcons: Record<string, React.ReactNode> = {
    github: <Github size={18} />,
    linkedin: <Linkedin size={18} />,
    twitter: <X size={18} />,
    instagram: <Instagram size={18} />,
    hashnode: <PenLine size={18} />,
    leetcode: <Code2 size={18} />,
    mail: <Mail size={18} />,
  };

  return (
    <footer className="relative w-full overflow-hidden bg-[#070707] pt-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24 mb-20">
          
          {/* Brand section */}
          <div className="flex flex-col space-y-6">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                <img src="/favicon.png" alt="Recall" className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-2xl font-serif font-black">Recall</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed font-light max-w-xs">
              Architecting spatial intelligence for modern minds. Your Recall, refined by obsidian aesthetics.
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
            {socialLinks.map(({ icon, name, href }) => (
              <a
                key={name}
                href={href}
                aria-label={name}
                className="hover:text-white transition-colors duration-500 opacity-60 hover:opacity-100"
              >
                {socialIcons[icon]}
              </a>
            ))}
          </div>
        </div>
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
