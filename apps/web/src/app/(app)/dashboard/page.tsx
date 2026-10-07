"use client";

import { useEffect, useState } from "react";
import { Tv2, Users, Trophy, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { LevelBadge } from "@/components/shared/LevelBadge";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface Room {
  id: string; name: string; platform: string;
  leaderId: string; visibility: string;
}

const platformIcon: Record<string, string> = {
  youtube: "🎬", spotify: "🎵", drive: "📁", web: "🌐",
};

export default function DashboardPage() {
  const { user, token }       = useAuthStore();
  const { setCreateRoomOpen } = useUiStore();
  const [rooms, setRooms]     = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.get<{ rooms: Room[] }>("/rooms", token)
      .then(({ rooms }) => setRooms(rooms))
      .catch(() => setRooms([]))
      .finally(() => setIsLoadingRooms(false));
  }, [token]);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">

      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hey, {user?.displayName ?? "there"} 👋
          </h1>
          <p className="text-muted-foreground mt-0.5">
            {rooms.length} public room{rooms.length !== 1 ? "s" : ""} open right now
          </p>
        </div>
        <Button onClick={() => setCreateRoomOpen(true)}>+ Create Room</Button>
      </div>

      {/* Stats */}
      {user && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Level",       value: `${user.level}`,           icon: Zap,    color: "text-primary" },
            { label: "Total XP",    value: user.xp.toLocaleString(),  icon: Trophy, color: "text-amber-400" },
            { label: "Watch Hours", value: "—",                       icon: Tv2,    color: "text-blue-400" },
            { label: "Guild",       value: "None",                    icon: Users,  color: "text-green-400" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon size={16} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="font-bold text-sm">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rooms */}
      <div className="space-y-3">
        <h2 className="font-semibold">Public Rooms</h2>
        {isLoadingRooms ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
              <span className="text-3xl">🎬</span>
              <p className="font-medium">No public rooms open</p>
              <p className="text-sm text-muted-foreground">Be the first to create one!</p>
              <Button size="sm" onClick={() => setCreateRoomOpen(true)}>
                Create a Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          rooms.map((room) => (
            <Card
              key={room.id}
              className="hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => window.location.href = `/room/${room.id}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl shrink-0">
                  {platformIcon[room.platform] ?? "🎬"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{room.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {room.platform} · {room.visibility}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); window.location.href = `/room/${room.id}`; }}
                >
                  Join
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}