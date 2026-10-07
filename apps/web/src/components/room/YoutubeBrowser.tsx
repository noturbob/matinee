"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, LayoutGrid, List, Loader2, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoCard } from "./VideoCard";
import {
  searchYoutube, getTrendingVideos,
  YT_CATEGORIES, type YTVideo,
} from "@/lib/youtube";
import { cn } from "@/lib/utils";

interface YoutubeBrowserProps {
  onSelect: (video: YTVideo) => void;
  onClose?: () => void;
}

type Layout = "grid" | "list";

export function YoutubeBrowser({ onSelect, onClose }: YoutubeBrowserProps) {
  const [query, setQuery]               = useState("");
  const [videos, setVideos]             = useState<YTVideo[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState("0");
  const [layout, setLayout]             = useState<Layout>("grid");
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [isSearching, setIsSearching]   = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load trending on mount
  useEffect(() => {
    loadTrending("0");
  }, []);

  async function loadTrending(categoryId: string) {
    setIsLoading(true);
    setIsSearching(false);
    setError(null);
    setNextPageToken(undefined);
    try {
      const results = await getTrendingVideos(categoryId);
      setVideos(results);
    } catch {
      setError("Couldn't load videos. Check your API key.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(q: string) {
    if (!q.trim()) {
      loadTrending(activeCategory);
      return;
    }
    setIsLoading(true);
    setIsSearching(true);
    setError(null);
    setNextPageToken(undefined);
    try {
      const results = await searchYoutube(q);
      setVideos(results.videos);
      setNextPageToken(results.nextPageToken);
    } catch {
      setError("Search failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Debounced search
  function onQueryChange(value: string) {
    setQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(value), 600);
  }

  function onCategoryClick(id: string) {
    setActiveCategory(id);
    setQuery("");
    loadTrending(id);
  }

  async function loadMore() {
    if (!nextPageToken || isLoadingMore || !query.trim()) return;
    setIsLoadingMore(true);
    try {
      const results = await searchYoutube(query, nextPageToken);
      setVideos((prev) => [...prev, ...results.videos]);
      setNextPageToken(results.nextPageToken);
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleSelect(video: YTVideo) {
    onSelect(video);
  }

  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search YouTube..."
            className="pl-9 pr-8 h-9"
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(""); loadTrending(activeCategory); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Layout toggle */}
        <div className="flex items-center border border-border rounded-md overflow-hidden shrink-0">
          <button
            onClick={() => setLayout("grid")}
            className={cn(
              "p-2 transition-colors",
              layout === "grid"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setLayout("list")}
            className={cn(
              "p-2 transition-colors",
              layout === "list"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <List size={14} />
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Category pills (only when not searching) ── */}
      {!query && (
        <div className="flex gap-2 px-4 py-2.5 border-b border-border overflow-x-auto shrink-0 scrollbar-none">
          {YT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryClick(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Section label ── */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          {isSearching ? (
            <><Search size={11} /> Results for "{query}"</>
          ) : (
            <><TrendingUp size={11} /> {YT_CATEGORIES.find(c => c.id === activeCategory)?.label ?? "Trending"}</>
          )}
        </p>
      </div>

      {/* ── Video Grid / List ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-2xl">⚠️</p>
            <p className="text-sm text-muted-foreground text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={() => loadTrending("0")}>
              Try again
            </Button>
          </div>
        )}

        {isLoading && !error && (
          <div
            className={cn(
              layout === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2"
                : "space-y-1 mt-2"
            )}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} layout={layout} />
            ))}
          </div>
        )}

        {!isLoading && !error && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-3xl">🎬</p>
            <p className="text-sm text-muted-foreground">No videos found</p>
          </div>
        )}

        {!isLoading && !error && videos.length > 0 && (
          <>
            <div
              className={cn(
                "mt-2",
                layout === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                  : "space-y-1"
              )}
            >
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  layout={layout}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            {/* Load more */}
            {nextPageToken && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <><Loader2 size={13} className="mr-2 animate-spin" /> Loading...</>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────

function SkeletonCard({ layout }: { layout: Layout }) {
  if (layout === "list") {
    return (
      <div className="flex gap-3 p-2">
        <div className="w-32 aspect-video rounded-md bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-muted animate-pulse rounded w-full" />
          <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-2.5 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="aspect-video bg-muted animate-pulse rounded-lg" />
      <div className="h-3 bg-muted animate-pulse rounded w-full" />
      <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
      <div className="h-2.5 bg-muted animate-pulse rounded w-1/2" />
    </div>
  );
}