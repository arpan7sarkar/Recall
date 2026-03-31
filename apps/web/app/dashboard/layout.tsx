"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AddContentModal } from "@/components/AddContentModal";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />

      <div
        className={cn(
          "flex flex-col transition-all duration-200",
          "lg:ml-[260px]",
          sidebarCollapsed && "lg:ml-[72px]"
        )}
        style={{
          marginLeft: undefined, // Let Tailwind handle responsive
        }}
      >
        <Topbar />

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>

      <AddContentModal />
    </div>
  );
}
