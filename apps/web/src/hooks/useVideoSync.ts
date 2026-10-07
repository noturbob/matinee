"use client";

import { useEffect, useRef } from "react";
import { useRoomStore } from "@/stores/roomStore";

// Returns the live server position, accounting for elapsed time since last event
export function useServerPosition(): number {
  const videoState = useRoomStore((s) => s.videoState);
  if (!videoState) return 0;
  if (!videoState.isPlaying) return videoState.position;
  const elapsed = (Date.now() - videoState.lastEventAt) / 1000;
  return videoState.position + elapsed;
}

// Drift correction — calls onHardSeek or onSpeedAdjust when client is out of sync
export function useVideoSync({
  getClientPosition,
  onHardSeek,
  onSpeedAdjust,
  isLeader,
}: {
  getClientPosition: () => number;
  onHardSeek: (position: number) => void;
  onSpeedAdjust: (rate: number) => void;
  isLeader: boolean;
}) {
  const videoState = useRoomStore((s) => s.videoState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLeader || !videoState?.isPlaying) return;

    intervalRef.current = setInterval(() => {
      const serverPos = (() => {
        if (!videoState.isPlaying) return videoState.position;
        const elapsed = (Date.now() - videoState.lastEventAt) / 1000;
        return videoState.position + elapsed;
      })();

      const clientPos = getClientPosition();
      const drift = serverPos - clientPos;
      const absDrift = Math.abs(drift);

      if (absDrift > 1.5) {
        onHardSeek(serverPos);
      } else if (absDrift > 0.5) {
        onSpeedAdjust(drift > 0 ? 1.05 : 0.95);
      } else {
        onSpeedAdjust(1.0); // reset to normal speed
      }
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [videoState, isLeader, getClientPosition, onHardSeek, onSpeedAdjust]);
}