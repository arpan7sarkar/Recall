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

  useKeyboardShortcut("n", openAddContent, { alt: true });

  return (
    <AuthGuard>
      <div className="h-screen w-screen flex p-2 sm:p-4 lg:p-6 gap-2 sm:gap-4 lg:gap-6 overflow-hidden bg-background text-muted-foreground font-sans selection:bg-(--accent-500)/30 relative">
        {/* Subtle Silver Pour in Dark Mode */}
        <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(192,192,192,0.15),transparent_50%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-10 bg-[radial-gradient(circle_at_bottom_left,rgba(192,192,192,0.1),transparent_50%)]" />
        
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <Topbar />

          <main className="flex-1 overflow-auto mt-4 sm:mt-6 pb-24 lg:pb-0 scroll-smooth">
            {children}
          </main>
        </div>

        <AddContentModal />
      </div>
    </AuthGuard>
  );
}
