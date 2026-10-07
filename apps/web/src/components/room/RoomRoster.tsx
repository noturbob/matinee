"use client";

import { Mic, MicOff, Crown, MoreVertical, UserX } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { LevelBadge } from "@/components/shared/LevelBadge";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRoomStore, type RoomMember } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

export function RoomRoster() {
  const { members, micEnabled } = useRoomStore();
  const { user } = useAuthStore();
  const amILeader = members.find((m) => m.id === user?.id)?.isLeader ?? false;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="font-semibold text-sm">
          Watching ({members.length})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            micEnabled={micEnabled}
            canManage={amILeader && member.id !== user?.id}
          />
        ))}
        {members.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Just you in here...
          </p>
        )}
      </div>
    </div>
  );
}

function MemberRow({
  member,
  micEnabled,
  canManage,
}: {
  member: RoomMember;
  micEnabled: boolean;
  canManage: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-1 group">
      <UserAvatar
        src={null}
        username={member.username}
        displayName={member.displayName}
        size="sm"
        showOnline
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {member.isLeader && (
            <Crown size={11} className="text-amber-400 shrink-0" />
          )}
          <span className="text-sm font-medium truncate">
            {member.displayName}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">@{member.username}</span>
      </div>

      {/* Mic status */}
      {micEnabled && (
        <div className={cn(
          "p-1 rounded",
          member.isMuted ? "text-muted-foreground" : "text-green-400"
        )}>
          {member.isMuted ? <MicOff size={13} /> : <Mic size={13} />}
        </div>
      )}

      {/* Leader actions */}
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all">
              <MoreVertical size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-sm">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive gap-2"
              onClick={() => {
                // TODO: emit socket kick event
                console.log("kick", member.id);
              }}
            >
              <UserX size={14} />
              Kick from room
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}