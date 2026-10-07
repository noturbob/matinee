"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Play, ChevronRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { YoutubeBrowserModal } from "./YoutubeBrowserModal";
import { type YTVideo } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { routes } from "@/config/site";
import { api } from "@/lib/api";

const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(50),
  maxMembers: z.number().min(2).max(50).default(10),
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;
type Platform = "youtube" | "spotify" | "drive" | "web";
type Visibility = "public" | "friends" | "private";

const platforms: { id: Platform; label: string; emoji: string }[] = [
  { id: "youtube", label: "YouTube",      emoji: "🎬" },
  { id: "spotify", label: "Spotify",      emoji: "🎵" },
  { id: "drive",   label: "Google Drive", emoji: "📁" },
  { id: "web",     label: "Web URL",      emoji: "🌐" },
];

const visibilities: { id: Visibility; label: string; desc: string }[] = [
  { id: "public",  label: "Public",  desc: "Anyone can join" },
  { id: "friends", label: "Friends", desc: "Only friends" },
  { id: "private", label: "Private", desc: "Invite only" },
];

export function CreateRoomModal() {
  const router = useRouter();
  const { createRoomOpen, setCreateRoomOpen } = useUiStore();

  const [platform, setPlatform]         = useState<Platform>("youtube");
  const [visibility, setVisibility]     = useState<Visibility>("friends");
  const [micEnabled, setMicEnabled]     = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [ytBrowserOpen, setYtBrowserOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YTVideo | null>(null);
  const [webUrl, setWebUrl]             = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { maxMembers: 10 },
  });

  function onClose() {
    setCreateRoomOpen(false);
    reset();
    setPlatform("youtube");
    setVisibility("friends");
    setMicEnabled(false);
    setSelectedVideo(null);
    setWebUrl("");
  }

  async function onSubmit(data: CreateRoomForm) {
    setIsLoading(true);
    try {
      const { token } = useAuthStore.getState();
      const res = await api.post<{ room: { id: string } }>(
        "/rooms",
        {
          name:       data.name,
          platform,
          visibility,
          micEnabled,
          maxMembers: data.maxMembers,
          videoId:    selectedVideo?.id ?? undefined,
          videoTitle: selectedVideo?.title ?? undefined,
          contentUrl: platform === "web" ? webUrl : undefined,
        },
        token ?? undefined
      );
      onClose();
      router.push(routes.room(res.room.id));
    } catch (err: any) {
      console.error("Failed to create room:", err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Dialog open={createRoomOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Room</DialogTitle>
            <DialogDescription>
              Set up your watch party.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">

            {/* Room name */}
            <div className="space-y-1.5">
              <Label>Room name</Label>
              <Input placeholder="Friday Night Movies" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Platform */}
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <div className="grid grid-cols-4 gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPlatform(p.id); setSelectedVideo(null); }}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border text-xs font-medium transition-colors",
                      platform === p.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-lg">{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Content picker — changes based on platform ── */}
            {platform === "youtube" && (
              <div className="space-y-1.5">
                <Label>Video</Label>
                {selectedVideo ? (
                  /* Selected video preview */
                  <div className="flex gap-3 p-2 rounded-lg border border-primary/50 bg-primary/5">
                    <img
                      src={selectedVideo.thumbnail}
                      alt={selectedVideo.title}
                      className="w-20 aspect-video object-cover rounded shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2 leading-snug">
                        {selectedVideo.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedVideo.channelName}
                      </p>
                      <button
                        type="button"
                        onClick={() => setYtBrowserOpen(true)}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        Change video
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Browse button */
                  <button
                    type="button"
                    onClick={() => setYtBrowserOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎬</span>
                      <div className="text-left">
                        <p className="text-sm font-medium">Browse YouTube</p>
                        <p className="text-xs text-muted-foreground">
                          Search or pick a trending video
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                    />
                  </button>
                )}
                <p className="text-xs text-muted-foreground">
                  Optional — you can also pick a video after the room starts.
                </p>
              </div>
            )}

            {platform === "web" && (
              <div className="space-y-1.5">
                <Label>Web URL</Label>
                <Input
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            {(platform === "spotify" || platform === "drive") && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-xl">
                  {platform === "spotify" ? "🎵" : "📁"}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {platform === "spotify" ? "Spotify" : "Google Drive"} browser
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Coming soon — you can add the link after the room starts.
                  </p>
                </div>
              </div>
            )}

            {/* Visibility */}
            <div className="space-y-1.5">
              <Label>Who can join</Label>
              <div className="grid grid-cols-3 gap-2">
                {visibilities.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVisibility(v.id)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 p-2.5 rounded-lg border text-xs transition-colors",
                      visibility === v.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <span className={cn("font-medium", visibility === v.id ? "text-primary" : "text-foreground")}>
                      {v.label}
                    </span>
                    <span className="text-muted-foreground">{v.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Max members + Mic */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Max members</Label>
                <Input
                  type="number"
                  min={2}
                  max={50}
                  {...register("maxMembers", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Voice chat</Label>
                <button
                  type="button"
                  onClick={() => setMicEnabled((v) => !v)}
                  className={cn(
                    "w-full h-9 rounded-md border text-sm font-medium transition-colors",
                    micEnabled
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  {micEnabled ? "🎤 Enabled" : "🔇 Disabled"}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Room"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* YouTube Browser Modal — separate so it's full size */}
      <YoutubeBrowserModal
        open={ytBrowserOpen}
        onClose={() => setYtBrowserOpen(false)}
        onSelect={(video) => {
          setSelectedVideo(video);
          setYtBrowserOpen(false);
        }}
      />
    </>
  );
}