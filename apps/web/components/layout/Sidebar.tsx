"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, ROUTES } from "@/lib/constants";
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
          "z-50 shrink-0 flex flex-col transition-all duration-300 ease-in-out border rounded-2xl overflow-hidden",
          "fixed inset-y-4 left-4 shadow-2xl backdrop-blur-xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-[150%]",
          "lg:relative lg:inset-0 lg:translate-x-0 lg:shadow-none lg:h-full lg:backdrop-blur-none",
          sidebarCollapsed ? "lg:w-[80px]" : "lg:w-[260px]",
          "bg-[var(--bg-secondary)] border-[var(--border)] shadow-sm"
        )}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0"
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-lg font-serif transition-all duration-500",
              "group-hover:rotate-360 group-hover:scale-110 transform-gpu",
              "bg-[var(--accent-500)]/10 text-[var(--accent-500)] border border-[var(--accent-500)]/20 shadow-[0_0_15px_rgba(192,192,192,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            )}
            style={{
              width: 32,
              height: 32,
              fontSize: 16,
            }}
          >
            R
          </div>
          {!sidebarCollapsed && (
            <span className="font-serif text-xl tracking-tight text-[var(--text-primary)]">
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
            const isHomePath = item.href === ROUTES.dashboard;
            const isActive = isHomePath 
              ? pathname === item.href 
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 focus-ring",
                  "text-sm font-light",
                  isActive 
                    ? "text-[var(--text-primary)] bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/10" 
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="flex items-center justify-center shrink-0 w-6">
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
            className="hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-light transition-colors focus-ring text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="flex items-center justify-center shrink-0 w-6">
              <Icon name={sidebarCollapsed ? "right" : "left"} size={18} />
            </span>
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-4 border-t border-[var(--border)] shrink-0">
          <div className="flex items-center justify-center rounded-full font-serif text-sm shrink-0 overflow-hidden w-9 h-9 bg-[var(--accent-500)]/10 text-[var(--accent-500)] border border-[var(--accent-500)]/20 shadow-inner">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.fullName || "User"} className="w-full h-full object-cover" />
            ) : (
              user?.fullName?.charAt(0)?.toUpperCase() ?? "U"
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {user?.fullName ?? "User"}
              </p>
              <button
                onClick={() => signOut()}
                className="text-xs font-light text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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
