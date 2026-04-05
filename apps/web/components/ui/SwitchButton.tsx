"use client";

/**
 * @author: @dorianbaffier
 * @description: Switch Button
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { Sun } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SwitchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "minimal";
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}

export default function SwitchButton({
  className,
  variant = "minimal",
  size = "default",
  showLabel = true,
  ...props
}: SwitchButtonProps) {
  const { setTheme, theme } = useUIStore();

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const variants = {
    minimal: [
      "rounded-lg",
      "bg-linear-to-b from-white/95 to-zinc-50/95 dark:from-zinc-800/95 dark:to-zinc-900/95",
      "hover:from-zinc-50/95 hover:to-zinc-100/95 dark:hover:from-zinc-700/95 dark:hover:to-zinc-800/95",
      "border border-zinc-200 dark:border-white/10",
      "hover:border-zinc-300 dark:hover:border-white/20",
      "shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_-1px_rgba(0,0,0,0.3)]",
      "hover:shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_2px_4px_-2px_rgba(0,0,0,0.4)]",
      "transition-all duration-300 ease-out",
      "backdrop-blur-md",
      "relative overflow-hidden",
    ],
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    default: "h-10 px-4",
    lg: "h-11 px-5",
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "group relative",
        "transition-all duration-300 ease-out",
        "text-zinc-500 dark:text-zinc-400",
        "hover:text-zinc-900 dark:hover:text-zinc-100",
        ...variants[variant],
        sizes[size],
        className
      )}
      onClick={handleThemeToggle}
      {...props}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          "transition-all duration-300 ease-out relative z-10"
        )}
      >
        <Sun
          className={cn(
            "transition-all duration-700 ease-in-out",
            size === "sm" && "h-3.5 w-3.5",
            size === "default" && "h-4 w-4",
            size === "lg" && "h-5 w-5",
            "group-hover:rotate-360 group-hover:scale-110",
            theme === "dark" ? "rotate-180" : "rotate-0",
            "transform-gpu shadow-sm",
            theme === "dark"
              ? "text-zinc-500 group-hover:text-[#0059ff]"
              : "text-[#0059ff] group-hover:text-[#0047cc]",
            "group-active:scale-95"
          )}
        />
        {showLabel && (
          <span
            className={cn(
              "relative font-medium capitalize min-w-[50px] text-left text-[11px] tracking-wide",
              "transition-opacity duration-300 ease-out"
            )}
          >
            <span
              className={cn(
                "absolute inset-0 flex items-center",
                theme === "dark" ? "opacity-0 invisible" : "opacity-100 visible",
                "transition-all duration-300 ease-out"
              )}
            >
              Light
            </span>
            <span
              className={cn(
                "absolute inset-0 flex items-center",
                theme === "dark" ? "opacity-100 visible" : "opacity-0 invisible",
                "transition-all duration-300 ease-out"
              )}
            >
              Dark
            </span>
            <span className="opacity-0">Light</span>
          </span>
        )}
      </div>

      {/* Interactive Shine Effect */}
      <span
        className={cn(
          "absolute inset-0",
          "bg-linear-to-r from-transparent via-white/10 to-transparent",
          "-translate-x-full",
          "group-hover:translate-x-full",
          "transition-transform duration-1000",
          "ease-in-out",
          "pointer-events-none",
          "z-1"
        )}
      />
      
      {/* Subtle Glow */}
      <span
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100",
          "bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]",
          "transition-opacity duration-500",
          "pointer-events-none",
          "z-0"
        )}
      />
    </Button>
  );
}
