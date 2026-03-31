"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full z-30 flex flex-col border-r transition-all duration-200 ease-in-out",
        "hidden lg:flex",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 border-b"
        style={{
          height: "var(--topbar-height)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="flex items-center justify-center rounded-lg font-bold text-white"
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
            className="font-semibold text-lg tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Recall
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 focus-ring",
                "text-sm font-medium",
                isActive
                  ? "text-white"
                  : "hover:opacity-80"
              )}
              style={{
                background: isActive ? "var(--accent-500)" : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
              }}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="text-lg" style={{ width: 24, textAlign: "center" }}>
                {item.icon}
              </span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebarCollapse}
        className="mx-3 mb-2 p-2 rounded-lg text-sm transition-colors focus-ring"
        style={{
          color: "var(--text-tertiary)",
          background: "transparent",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? "→" : "← Collapse"}
      </button>

      {/* User section */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-center rounded-full font-semibold text-sm flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            background: "var(--accent-100)",
            color: "var(--accent-700)",
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.name ?? "User"}
            </p>
            <button
              onClick={logout}
              className="text-xs hover:underline"
              style={{ color: "var(--text-tertiary)" }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
