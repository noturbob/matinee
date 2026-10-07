"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Tv2, Users, Trophy, CalendarDays,
  Settings, ChevronLeft, ChevronRight, Plus, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/shared/Logo";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { LevelBadge } from "@/components/shared/LevelBadge";
import { XpBar } from "@/components/shared/XpBar";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/site";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { label: "Home",        href: routes.dashboard,    icon: Home },
  { label: "Rooms",       href: "/rooms",             icon: Tv2 },
  { label: "Guilds",      href: "/guilds",            icon: Users },
  { label: "Leaderboard", href: routes.leaderboard,   icon: Trophy },
  { label: "Events",      href: routes.events,        icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setCreateRoomOpen } = useUiStore();
  const { user } = useAuthStore();
  const { logout } = useAuth();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-screen bg-[hsl(var(--sidebar-bg))] border-r border-border",
          "transition-all duration-200 ease-in-out shrink-0",
          sidebarOpen ? "w-56" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-border">
          {sidebarOpen && <Logo />}
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
              !sidebarOpen && "mx-auto"
            )}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Create Room Button */}
        <div className="px-3 py-3 border-b border-border">
          {sidebarOpen ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => setCreateRoomOpen(true)}
            >
              <Plus size={14} className="mr-1.5" />
              Create Room
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="default"
                  className="w-10 h-10 mx-auto flex"
                  onClick={() => setCreateRoomOpen(true)}
                >
                  <Plus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Create Room</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== routes.dashboard && pathname.startsWith(item.href));

            return sidebarOpen ? (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            ) : (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon size={16} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t border-border px-3 py-3">
            {sidebarOpen ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={user.avatarUrl}
                    username={user.username}
                    displayName={user.displayName}
                    size="sm"
                    showOnline
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">
                        {user.displayName}
                      </span>
                      <LevelBadge level={user.level} />
                    </div>
                    <span className="text-xs text-muted-foreground truncate block">
                      @{user.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={routes.settings}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                      <Settings size={14} />
                    </Link>
                    <button
                      onClick={logout}
                      className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                      title="Sign out"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                </div>
                <XpBar xp={user.xp} level={user.level} />
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={routes.profile(user.username)}
                    className="flex justify-center"
                  >
                    <UserAvatar
                      src={user.avatarUrl}
                      username={user.username}
                      size="sm"
                      showOnline
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {user.displayName} · Lv.{user.level}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}