"use client";

import { useEffect, useRef, useCallback } from "react";

// Extend window type for YouTube IFrame API
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YoutubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  position: number;           // seconds — seek to this on mount/leader command
  isLeader: boolean;
  onPlay: (position: number) => void;
  onPause: (position: number) => void;
  onSeek: (position: number) => void;
  onBuffer: () => void;
}

// Extract YouTube video ID from a URL
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

let apiLoaded = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeApi(callback: () => void) {
  if (apiLoaded && window.YT?.Player) {
    callback();
    return;
  }
  readyCallbacks.push(callback);
  if (document.getElementById("yt-api-script")) return;

  window.onYouTubeIframeAPIReady = () => {
    apiLoaded = true;
    readyCallbacks.forEach((cb) => cb());
    readyCallbacks.length = 0;
  };

  const script = document.createElement("script");
  script.id = "yt-api-script";
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);
}

export function YoutubePlayer({
  videoId,
  isPlaying,
  position,
  isLeader,
  onPlay,
  onPause,
  onSeek,
  onBuffer,
}: YoutubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const isReady = useRef(false);
  const lastPosition = useRef(position);
  const isSeeking = useRef(false);

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !videoId) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: isLeader ? 1 : 0,   // only leader sees controls
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
      },
      events: {
        onReady: () => {
          isReady.current = true;
          if (position > 0) {
            playerRef.current?.seekTo(position, true);
          }
          if (isPlaying) {
            playerRef.current?.playVideo();
          }
        },
        onStateChange: (event) => {
          if (!isLeader) return; // only leader fires sync events
          const p = playerRef.current?.getCurrentTime() ?? 0;

          switch (event.data) {
            case window.YT.PlayerState.PLAYING:
              onPlay(p);
              break;
            case window.YT.PlayerState.PAUSED:
              if (!isSeeking.current) onPause(p);
              isSeeking.current = false;
              break;
            case window.YT.PlayerState.BUFFERING:
              onBuffer();
              break;
          }
        },
      },
    });
  }, [videoId, isLeader, position, isPlaying, onPlay, onPause, onBuffer]);

  // Load API and init player
  useEffect(() => {
    loadYouTubeApi(initPlayer);
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      isReady.current = false;
    };
  }, [initPlayer]);

  // Sync play/pause from server (for non-leaders)
  useEffect(() => {
    if (!isReady.current || isLeader) return;
    if (isPlaying) {
      playerRef.current?.playVideo();
    } else {
      playerRef.current?.pauseVideo();
    }
  }, [isPlaying, isLeader]);

  // Sync position from server
  useEffect(() => {
    if (!isReady.current || isLeader) return;
    const drift = Math.abs(position - lastPosition.current);
    if (drift > 1.5) {
      // Hard seek — too far out of sync
      isSeeking.current = true;
      playerRef.current?.seekTo(position, true);
    }
    lastPosition.current = position;
  }, [position, isLeader]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      {!videoId && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No video loaded</p>
        </div>
      )}
    </div>
  );
}