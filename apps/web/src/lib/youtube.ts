const YT_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!;

export interface YTVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  viewCount: string;
  duration: string;       // formatted: "12:34"
  publishedAt: string;
}

export interface YTSearchResult {
  videos: YTVideo[];
  nextPageToken?: string;
}

// ── Helpers ──────────────────────────────────────────────────────

function formatDuration(iso: string): string {
  // ISO 8601 duration: PT1H2M3S → 1:02:03
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViewCount(count: string): string {
  const n = parseInt(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K views`;
  return `${n} views`;
}

// Takes raw search items + fetches full details (duration, viewCount)
async function enrichVideos(ids: string[]): Promise<YTVideo[]> {
  if (ids.length === 0) return [];
  const res = await fetch(
    `${YT_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${ids.join(",")}&key=${API_KEY}`
  );
  const data = await res.json();

  return (data.items ?? []).map((item: any): YTVideo => ({
    id: item.id,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ??
      item.snippet.thumbnails?.default?.url ?? "",
    channelName: item.snippet.channelTitle,
    viewCount: formatViewCount(item.statistics?.viewCount ?? "0"),
    duration: formatDuration(item.contentDetails?.duration ?? "PT0S"),
    publishedAt: item.snippet.publishedAt,
  }));
}

// ── Public API ────────────────────────────────────────────────────

export async function searchYoutube(
  query: string,
  pageToken?: string
): Promise<YTSearchResult> {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: "20",
    q: query,
    key: API_KEY,
    ...(pageToken ? { pageToken } : {}),
  });

  const res = await fetch(`${YT_API_BASE}/search?${params}`);
  const data = await res.json();

  if (data.error) throw new Error(data.error.message);

  const ids = (data.items ?? []).map((i: any) => i.id.videoId).filter(Boolean);
  const videos = await enrichVideos(ids);

  return { videos, nextPageToken: data.nextPageToken };
}

export async function getTrendingVideos(
  categoryId = "0"         // 0 = all, 10 = music, 20 = gaming, 24 = entertainment
): Promise<YTVideo[]> {
  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    chart: "mostPopular",
    regionCode: "US",
    maxResults: "20",
    videoCategoryId: categoryId,
    key: API_KEY,
  });

  const res = await fetch(`${YT_API_BASE}/videos?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return (data.items ?? []).map((item: any): YTVideo => ({
    id: item.id,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ??
      item.snippet.thumbnails?.default?.url ?? "",
    channelName: item.snippet.channelTitle,
    viewCount: formatViewCount(item.statistics?.viewCount ?? "0"),
    duration: formatDuration(item.contentDetails?.duration ?? "PT0S"),
    publishedAt: item.snippet.publishedAt,
  }));
}

export const YT_CATEGORIES = [
  { id: "0",  label: "Trending",     emoji: "🔥" },
  { id: "10", label: "Music",        emoji: "🎵" },
  { id: "20", label: "Gaming",       emoji: "🎮" },
  { id: "24", label: "Entertainment",emoji: "🎭" },
  { id: "28", label: "Science",      emoji: "🔬" },
  { id: "17", label: "Sports",       emoji: "⚽" },
];