"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { useUser, useClerk } from "@clerk/nextjs";
import { Icon } from "@/components/shared/Icon";
import SwitchButton from "@/components/ui/SwitchButton";

export function Sidebar() {

  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapse, theme, setTheme } = useUIStore();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          "z-50 shrink-0 flex flex-col border transition-all duration-300 ease-in-out rounded-4xl overflow-hidden",
          // Mobile: absolute/fixed with full height inside the wrapper
          "fixed inset-y-4 left-4 shadow-2xl backdrop-blur-xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-[150%]",
          // Desktop: static/relative
          "lg:relative lg:inset-0 lg:translate-x-0 lg:shadow-none lg:h-full lg:backdrop-blur-none",
          sidebarCollapsed ? "lg:w-[80px]" : "lg:w-[260px]"
        )}
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 border-b shrink-0"
          style={{
            height: "var(--topbar-height)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-lg font-bold text-white transition-all duration-500",
              "group-hover:rotate-360 group-hover:scale-110",
              theme === "dark" ? "rotate-180" : "rotate-0",
              "transform-gpu",
              "drop-shadow-none",
              theme === "dark"
                ? "text-zinc-500 group-hover:text-indigo-400"
                : "text-indigo-600 group-hover:text-indigo-700",
              "group-active:scale-95"
            )}
            style={{
              width: 36,
              height: 36,
              background: "var(--accent-500)",
              borderRadius: "var(--radius-sm)",
              fontSize: 18,
            }}
          >
            R
          </div>
          {!sidebarCollapsed && (
            <span
              className="font-black text-xl tracking-tighter uppercase"
              style={{ color: "var(--text-primary)" }}
            >
              Recall
            </span>
          )}

          {/* Mobile close */}
          <button
            onClick={toggleSidebar}
            className="ml-auto lg:hidden p-1.5 rounded-lg focus-ring"
            style={{ color: "var(--text-tertiary)" }}
            aria-label="Close sidebar"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close mobile sidebar on nav
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 focus-ring",
                  "text-xs font-black uppercase tracking-widest",
                  isActive ? "text-white shadow-md" : "hover:bg-white/5 opacity-60 hover:opacity-100"
                )}
                style={{
                  background: isActive ? "var(--accent-500)" : "transparent",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="flex items-center justify-center shrink-0" style={{ width: 24 }}>
                  <Icon name={item.icon} size={18} />
                </span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-2 space-y-1">
          <SwitchButton
            showLabel={!sidebarCollapsed}
            size={sidebarCollapsed ? "sm" : "default"}
            className="w-full justify-start"
          />

          {/* Collapse toggle — desktop only */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-ring"
            style={{ color: "var(--text-tertiary)", background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="flex items-center justify-center shrink-0" style={{ width: 24 }}>
              <Icon name={sidebarCollapsed ? "right" : "left"} size={18} />
            </span>
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* User section */}
        <div
          className="flex items-center gap-3 px-4 py-4 border-t shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-center rounded-full font-semibold text-sm shrink-0 overflow-hidden"
            style={{
              width: 36,
              height: 36,
              background: "var(--accent-100)",
              color: "var(--accent-700)",
            }}
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName || "User"} className="w-full h-full object-cover" />
            ) : (
              user?.fullName?.charAt(0)?.toUpperCase() ?? "U"
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.fullName ?? "User"}
              </p>
              <button
                onClick={() => signOut()}
                className="text-xs hover:underline"
                style={{ color: "var(--text-tertiary)" }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
