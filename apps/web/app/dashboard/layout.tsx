"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AddContentModal } from "@/components/AddContentModal";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useUIStore } from "@/store/uiStore";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed, openAddContent } = useUIStore();

  useKeyboardShortcut("k", openAddContent);

  return (
    <AuthGuard>
      <div className="h-screen w-screen flex p-4 lg:p-6 gap-6 overflow-hidden bg-[#070707] text-zinc-300 font-sans selection:bg-indigo-500/30">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <Topbar />

          <main className="flex-1 overflow-auto mt-6 pb-24 lg:pb-0 scroll-smooth">
            {children}
          </main>
        </div>

        <AddContentModal />
      </div>
    </AuthGuard>
  );
}
