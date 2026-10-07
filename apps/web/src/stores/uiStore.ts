import { create } from "zustand";

interface UiStore {
  sidebarOpen: boolean;
  createRoomOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCreateRoomOpen: (open: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  createRoomOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCreateRoomOpen: (createRoomOpen) => set({ createRoomOpen }),
}));