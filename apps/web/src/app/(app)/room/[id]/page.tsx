"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic, MicOff, PhoneOff, Settings2, Share2, MessageSquare, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { YoutubePlayer } from "@/components/room/YoutubePlayer";
import { RoomChat } from "@/components/room/RoomChat";
import { RoomRoster } from "@/components/room/RoomRoster";
import { YoutubeBrowserModal } from "@/components/room/YoutubeBrowserModal";
import { useRoomStore } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useVideoSync } from "@/hooks/useVideoSync";
import { api } from "@/lib/api";
import { type YTVideo } from "@/lib/youtube";

interface RoomData {
  id: string;
  name: string;
  platform: "youtube" | "spotify" | "drive" | "web";
  videoId: string | null;
  videoTitle: string | null;
  leaderId: string;
  micEnabled: boolean;
  maxMembers: number;
}

export default function RoomPage() {
  const params  = useParams();
  const router  = useRouter();
  const roomId  = params.id as string;

  const { user, token }       = useAuthStore();
  const { videoState, members, micEnabled, myMicOn, toggleMyMic } = useRoomStore();

  const [room, setRoom]               = useState<RoomData | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [ytBrowserOpen, setYtBrowserOpen] = useState(false);

  const { sendPlay, sendPause, sendSeek, sendVideoChange, kickMember, toggleMic } =
    useRoomSocket(roomId);

  // Ref for drift correction
  const playerApiRef = useRef<{
    getCurrentTime: () => number;
    setPlaybackRate: (r: number) => void;
    seekTo: (s: number) => void;
  } | null>(null);

  const isLeader = room?.leaderId === user?.id;

  // ── Fetch room data ─────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    api.get<{ room: RoomData }>(`/rooms/${roomId}`, token)
      .then(({ room }) => setRoom(room))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [roomId, token]);

  // ── Drift correction ────────────────────────────────────────
  useVideoSync({
    isLeader,
    getClientPosition: () => playerApiRef.current?.getCurrentTime() ?? 0,
    onHardSeek:        (pos) => playerApiRef.current?.seekTo(pos),
    onSpeedAdjust:     (rate) => playerApiRef.current?.setPlaybackRate(rate),
  });

  function handleVideoChange(video: YTVideo) {
    sendVideoChange(roomId, video.id, video.title);
    setYtBrowserOpen(false);
  }

  function handleLeave() {
    router.push("/dashboard");
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`);
  }

  // ── Loading states ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Joining room...</p>
        </div>
      </div>
    );
  }

  if (notFound || !room) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-3xl">🚪</p>
          <p className="font-semibold">Room not found</p>
          <p className="text-sm text-muted-foreground">It may have been closed.</p>
          <Button size="sm" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Current video — prefer live state from socket, fall back to room data
  const currentVideoId    = videoState?.videoId    ?? room.videoId    ?? "";
  const currentVideoTitle = videoState?.videoTitle ?? room.videoTitle ?? "";

  return (
    <div className="flex h-full gap-4 animate-fade-in">

      {/* ── Left — Video + controls ── */}
      <div className="flex flex-col flex-1 min-w-0 gap-3">

        {/* Room header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg leading-tight">{room.name}</h1>
            <p className="text-xs text-muted-foreground">
              {members.length} watching ·{" "}
              {currentVideoTitle ? (
                <span className="text-foreground">{currentVideoTitle}</span>
              ) : (
                "No video loaded"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={copyInviteLink}>
              <Share2 size={13} /> Invite
            </Button>

            {isLeader && room.platform === "youtube" && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                onClick={() => setYtBrowserOpen(true)}>
                🎬 Change Video
              </Button>
            )}

            {isLeader && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
                onClick={() => toggleMic(!micEnabled)}>
                <Settings2 size={13} />
                {micEnabled ? "Disable Mic" : "Enable Mic"}
              </Button>
            )}

            <Button variant="destructive" size="sm" className="h-8 gap-1.5 text-xs"
              onClick={handleLeave}>
              <PhoneOff size={13} /> Leave
            </Button>
          </div>
        </div>

        {/* Video Player */}
        {room.platform === "youtube" ? (
          currentVideoId ? (
            <YoutubePlayer
              videoId={currentVideoId}
              isPlaying={videoState?.isPlaying ?? false}
              position={videoState?.position ?? 0}
              isLeader={isLeader}
              onPlay={(pos) => sendPlay(roomId, pos)}
              onPause={(pos) => sendPause(roomId, pos)}
              onSeek={(pos) => sendSeek(roomId, pos)}
              onBuffer={() => {}}
            />
          ) : (
            /* No video selected yet */
            <div
              className="relative w-full aspect-video bg-muted/50 rounded-lg border-2 border-dashed border-border
                         flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50
                         hover:bg-primary/5 transition-colors"
              onClick={() => isLeader && setYtBrowserOpen(true)}
            >
              <span className="text-4xl">🎬</span>
              <div className="text-center">
                <p className="font-medium text-sm">No video selected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isLeader ? "Click to browse YouTube" : "Waiting for the leader to pick a video"}
                </p>
              </div>
              {isLeader && (
                <Button size="sm" variant="outline">Browse YouTube</Button>
              )}
            </div>
          )
        ) : (
          <div className="w-full aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {room.platform} support coming soon
            </p>
          </div>
        )}

        {/* Bottom bar — members + mic */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center -space-x-2">
            {members.slice(0, 6).map((m) => (
              <div
                key={m.id}
                className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background
                           flex items-center justify-center text-xs font-bold text-primary"
                title={m.displayName}
              >
                {m.displayName.slice(0, 1).toUpperCase()}
              </div>
            ))}
            {members.length > 6 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-background
                              flex items-center justify-center text-xs text-muted-foreground">
                +{members.length - 6}
              </div>
            )}
            {members.length === 0 && (
              <span className="text-xs text-muted-foreground">No one here yet</span>
            )}
          </div>

          {micEnabled && (
            <Button
              variant={myMicOn ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={toggleMyMic}
            >
              {myMicOn ? <Mic size={13} /> : <MicOff size={13} />}
              {myMicOn ? "Mute" : "Unmute"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Right — Chat + Roster ── */}
      <div className="w-72 shrink-0 flex flex-col border border-border rounded-xl overflow-hidden bg-card">
        <Tabs defaultValue="chat" className="flex flex-col h-full">
          <TabsList className="w-full rounded-none border-b border-border h-10 bg-transparent p-0">
            <TabsTrigger
              value="chat"
              className="flex-1 gap-1.5 text-xs rounded-none border-b-2 border-transparent
                         data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
            >
              <MessageSquare size={13} /> Chat
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="flex-1 gap-1.5 text-xs rounded-none border-b-2 border-transparent
                         data-[state=active]:border-primary data-[state=active]:bg-transparent h-full"
            >
              <Users size={13} /> Members ({members.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 overflow-hidden mt-0 p-0 data-[state=inactive]:hidden">
            <RoomChat />
          </TabsContent>
          <TabsContent value="members" className="flex-1 overflow-hidden mt-0 p-0 data-[state=inactive]:hidden">
            <RoomRoster />
          </TabsContent>
        </Tabs>
      </div>

      {/* YouTube Browser */}
      <YoutubeBrowserModal
        open={ytBrowserOpen}
        onClose={() => setYtBrowserOpen(false)}
        title="Pick a Video"
        onSelect={handleVideoChange}
      />
    </div>
  );
}