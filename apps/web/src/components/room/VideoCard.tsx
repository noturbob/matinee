import { Play } from "lucide-react";
import { type YTVideo } from "@/lib/youtube";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: YTVideo;
  onSelect: (video: YTVideo) => void;
  layout?: "grid" | "list";
}

export function VideoCard({ video, onSelect, layout = "grid" }: VideoCardProps) {
  if (layout === "list") {
    return (
      <button
        onClick={() => onSelect(video)}
        className="flex gap-3 w-full text-left hover:bg-accent/50 rounded-lg p-2 transition-colors group"
      >
        <div className="relative shrink-0 w-32 aspect-video rounded-md overflow-hidden bg-muted">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1 rounded">
            {video.duration}
          </span>
          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play size={20} className="text-white fill-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground">
            {video.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{video.channelName}</p>
          <p className="text-xs text-muted-foreground">{video.viewCount}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onSelect(video)}
      className="group text-left w-full"
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
          {video.duration}
        </span>
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Play size={18} className="text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground">
        {video.title}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{video.channelName}</p>
      <p className="text-xs text-muted-foreground">{video.viewCount}</p>
    </button>
  );
}