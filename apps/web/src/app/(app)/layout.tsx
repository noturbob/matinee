"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRoomPage = pathname.startsWith("/room/");

  return (
    <AppShell noPadding={isRoomPage}>
      {children}
    </AppShell>
  );
}