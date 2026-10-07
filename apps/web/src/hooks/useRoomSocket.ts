"use client";

import { useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { useRoomStore, type RoomMember, type ChatMessage, type VideoState } from "@/stores/roomStore";
import { useAuthStore } from "@/stores/authStore";

export function useRoomSocket(roomId: string) {
  const { token } = useAuthStore();
  const {
    setMembers, addMember, removeMember,
    setVideoState, addMessage,
    setMicEnabled, clearRoom,
  } = useRoomStore();

  const socket = getSocket();

  // Emit helpers
  const sendMessage = useCallback(
    (content: string) => socket.emit("chat:message", { roomId, content }),
    [socket, roomId]
  );

  const sendPlay = useCallback(
    (position: number) => socket.emit("video:play", { roomId, position }),
    [socket, roomId]
  );

  const sendPause = useCallback(
    (position: number) => socket.emit("video:pause", { roomId, position }),
    [socket, roomId]
  );

  const sendSeek = useCallback(
    (position: number) => socket.emit("video:seek", { roomId, position }),
    [socket, roomId]
  );

  const sendVideoChange = useCallback(
    (roomId: string, videoId: string, videoTitle: string) =>
      socket.emit("video:change", { roomId, videoId, videoTitle }),
    [socket]
  );

  const kickMember = useCallback(
    (userId: string) => socket.emit("room:kick", { roomId, userId }),
    [socket, roomId]
  );

  const toggleMic = useCallback(
    (enabled: boolean) => socket.emit("room:mic_toggle", { roomId, enabled }),
    [socket, roomId]
  );

  useEffect(() => {
    if (!token || !roomId) return;

    // Authenticate socket if not connected
    if (!socket.connected) {
      socket.auth = { token };
      socket.connect();
    }

    // Join room
    socket.emit("room:join", { roomId });

    // ── Listeners ──────────────────────────────────────────

    socket.on("room:state", (data: { members: RoomMember[]; videoState: VideoState; micEnabled: boolean }) => {
      setMembers(data.members);
      setVideoState(data.videoState);
      setMicEnabled(data.micEnabled);
    });

    socket.on("room:join", (member: RoomMember) => addMember(member));
    socket.on("room:leave", ({ userId }: { userId: string }) => removeMember(userId));
    socket.on("room:kick", ({ userId }: { userId: string }) => removeMember(userId));
    socket.on("room:mic_toggle", ({ enabled }: { enabled: boolean }) => setMicEnabled(enabled));

    socket.on("video:play",  (state: VideoState) => setVideoState(state));
    socket.on("video:pause", (state: VideoState) => setVideoState(state));
    socket.on("video:seek",  (state: VideoState) => setVideoState(state));
    socket.on("video:change", (state: VideoState) => {
      setVideoState(state);
    });

    socket.on("chat:message", (msg: ChatMessage) => addMessage(msg));

    socket.on("force_logout", () => {
      clearRoom();
      window.location.href = "/login";
    });

    return () => {
      socket.emit("room:leave", { roomId });
      socket.off("room:state");
      socket.off("room:join");
      socket.off("room:leave");
      socket.off("room:kick");
      socket.off("room:mic_toggle");
      socket.off("video:play");
      socket.off("video:pause");
      socket.off("video:seek");
      socket.off("video:change");
      socket.off("chat:message");
      socket.off("force_logout");
      clearRoom();
    };
  }, [roomId, token]);

  return { sendMessage, sendPlay, sendPause, sendSeek, sendVideoChange, kickMember, toggleMic };
}