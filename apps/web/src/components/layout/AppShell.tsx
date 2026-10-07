"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CreateRoomModal } from "@/components/room/CreateRoomModal";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  noPadding?: boolean;
}

export function AppShell({ children, title, noPadding }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className={cn(
          "flex-1 overflow-y-auto",
          noPadding ? "p-4" : "p-6"
        )}>
          {children}
        </main>
      </div>
      <CreateRoomModal />
    </div>
  );
}