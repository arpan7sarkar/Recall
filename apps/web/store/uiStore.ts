"use client";

import { create } from "zustand";

type ViewMode = "grid" | "list";
type Theme = "light" | "dark";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  viewMode: ViewMode;
  theme: Theme;
  addContentModalOpen: boolean;

  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: Theme) => void;
  openAddContent: () => void;
  closeAddContent: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  viewMode: "grid",
  theme: "dark",
  addContentModalOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapse: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTheme: (theme) => set({ theme }),
  openAddContent: () => set({ addContentModalOpen: true }),
  closeAddContent: () => set({ addContentModalOpen: false }),
}));
