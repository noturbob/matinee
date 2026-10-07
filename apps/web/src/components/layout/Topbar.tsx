"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="h-14 border-b border-border bg-[hsl(var(--topbar-bg))] flex items-center px-4 gap-4 shrink-0">
      {title && (
        <h1 className="font-semibold text-base shrink-0">{title}</h1>
      )}

      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search rooms, people, guilds..."
          className="pl-8 h-8 text-sm bg-muted/50"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {user?.isPremium && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            PREMIUM
          </span>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell size={16} />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  );
}