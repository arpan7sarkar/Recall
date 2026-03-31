"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AddContentModal } from "@/components/AddContentModal";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <Sidebar />

        <div
          className={cn(
            "flex flex-col min-h-screen transition-all duration-200",
            "lg:ml-[260px]",
            sidebarCollapsed && "lg:ml-[72px]"
          )}
        >
          <Topbar />

          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>

        <AddContentModal />
      </div>
    </AuthGuard>
  );
}
